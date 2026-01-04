import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/app/lib/supabaseServer";

const MAX_RESUME_LENGTH = 10_000;

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") ?? undefined;
  const supabase = getSupabaseClient(authHeader);

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobPostId, resumeText } = await req.json().catch(() => ({}));
  if (!jobPostId || !resumeText) {
    return NextResponse.json(
      { error: "jobPostId and resumeText are required" },
      { status: 400 },
    );
  }

  if (resumeText.length > MAX_RESUME_LENGTH) {
    return NextResponse.json(
      { error: `Resume text too long (max ${MAX_RESUME_LENGTH} chars)` },
      { status: 400 },
    );
  }

  // Load job
  const { data: job, error: jobError } = await supabase
    .from("job_posts")
    .select("raw_text, user_id")
    .eq("id", jobPostId)
    .eq("user_id", userId)
    .maybeSingle();

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message || "Job not found" },
      { status: 404 },
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY environment variable" },
      { status: 500 },
    );
  }

  const prompt = [
    { role: "system", content: "You compare resumes to job descriptions." },
    {
      role: "user",
      content: `Job description:\n${job.raw_text}\n\nResume:\n${resumeText}\n\nReturn JSON ONLY with keys: missing_skills (string[]), learning_plan (string[]), suggested_bullets (string[]).`,
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

  try {
    const json = await groqRes.json();
    const rawContent = json?.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent.trim() : "";
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned || "{}");
    return NextResponse.json({ comparison: parsed });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse Groq response as JSON" },
      { status: 500 },
    );
  }
}
