import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/app/lib/supabaseServer";

const MAX_LENGTH = 10_000;
const RATE_LIMIT = 5; // per minute per user (in-memory)
const rateBucket = new Map<string, { count: number; reset: number }>();

type GroqAnalysis = {
  summary: string;
  skills_required: string[];
  nice_to_have: string[];
  checklist: string[];
};

function rateLimit(userId: string) {
  const now = Date.now();
  const bucket = rateBucket.get(userId);
  if (!bucket || bucket.reset < now) {
    rateBucket.set(userId, { count: 1, reset: now + 60_000 });
    return false;
  }

  if (bucket.count >= RATE_LIMIT) return true;
  bucket.count += 1;
  return false;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") ?? undefined;
  const supabase = getSupabaseClient(authHeader);

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobPostId } = await req.json().catch(() => ({}));
  if (!jobPostId) {
    return NextResponse.json({ error: "jobPostId is required" }, { status: 400 });
  }

  const isRateLimited = rateLimit(userId);
  if (isRateLimited) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 },
    );
  }

  // Load job post and ensure ownership
  const { data: job, error: jobError } = await supabase
    .from("job_posts")
    .select("*")
    .eq("id", jobPostId)
    .eq("user_id", userId)
    .maybeSingle();

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message || "Job not found" },
      { status: 404 },
    );
  }

  if (!job.raw_text || job.raw_text.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `Job description must be between 1 and ${MAX_LENGTH} characters.` },
      { status: 400 },
    );
  }

  // Return cached analysis if exists
  const { data: existing } = await supabase
    .from("ai_analysis")
    .select("*")
    .eq("job_post_id", jobPostId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ analysis: existing });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY environment variable" },
      { status: 500 },
    );
  }

  const prompt = [
    { role: "system", content: "You are an assistant that extracts job requirements." },
    {
      role: "user",
      content: `Analyze this job description. Return JSON ONLY with keys: summary (string), skills_required (string[]), nice_to_have (string[]), checklist (string[]). Do not include any other text.\n\n${job.raw_text}`,
    },
  ];

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: prompt,
      temperature: 0,
      // Ask Groq to return structured JSON
      response_format: { type: "json_object" },
    }),
  });

  if (!groqRes.ok) {
    const text = await groqRes.text();
    return NextResponse.json(
      { error: `Groq request failed: ${groqRes.status} ${text}` },
      { status: 502 },
    );
  }

  let parsed: GroqAnalysis | undefined;
  try {
    const json = await groqRes.json();
    const rawContent = json?.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent.trim() : "";
    // Strip optional markdown fences
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    parsed = JSON.parse(cleaned) as GroqAnalysis;
  } catch {
    return NextResponse.json(
      { error: "Failed to parse Groq response as JSON" },
      { status: 500 },
    );
  }

  const { data: saved, error: saveError } = await supabase
    .from("ai_analysis")
    .insert({
      job_post_id: jobPostId,
      user_id: userId,
      summary: parsed?.summary,
      skills_required: parsed?.skills_required ?? [],
      nice_to_have: parsed?.nice_to_have ?? [],
      checklist: parsed?.checklist ?? [],
    })
    .select("*")
    .maybeSingle();

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  return NextResponse.json({ analysis: saved });
}
