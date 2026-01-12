"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

type Job = {
  id: string;
  title: string;
  company: string;
  url: string | null;
  raw_text: string;
  created_at: string;
};

type Analysis = {
  summary: string | null;
  skills_required: string[] | null;
  nice_to_have: string[] | null;
  checklist: string[] | null;
};

// Auth-only job detail page: shows job info, AI analysis, and resume comparison.
export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeResult, setResumeResult] = useState<{
    missing_skills?: string[];
    learning_plan?: string[];
    suggested_bullets?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJob() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.push("/login");
        return;
      }

      const { data: jobData, error: jobError } = await supabase
        .from("job_posts")
        .select("*")
        .eq("id", id)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (jobError || !jobData) {
        setError(jobError?.message || "Job not found");
        setLoading(false);
        return;
      }

      setJob(jobData as Job);

      const { data: analysisData } = await supabase
        .from("ai_analysis")
        .select("summary,skills_required,nice_to_have,checklist")
        .eq("job_post_id", id)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      setAnalysis((analysisData ?? null) as Analysis | null);
      setLoading(false);
    }

    loadJob();
  }, [id, router]);

  async function callWithAuth(path: string, body: Record<string, unknown>) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Request failed");
    }
    return json;
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const { analysis: latest } = await callWithAuth("/api/analyze-job", {
        jobPostId: id,
      });
      setAnalysis(latest);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleClearAnalysis() {
    setAnalysis(null);
    setResumeResult(null);
    setError(null);
  }

  async function handleCompareResume() {
    setComparing(true);
    setError(null);
    setResumeResult(null);
    try {
      const { comparison } = await callWithAuth("/api/compare-resume", {
        jobPostId: id,
        resumeText,
      });
      setResumeResult(comparison ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setComparing(false);
    }
  }

  const renderList = (items?: string[] | null) => {
    if (!items || items.length === 0) return <p className="text-gray-600">None.</p>;
    return (
      <ul className="list-disc space-y-1 pl-5 text-gray-700">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      {loading && <p className="text-gray-600">Loading job...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {job && (
        <>
          <div className="glass-card p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-3xl font-semibold leading-tight">{job.title}</h2>
                <p className="text-lg font-medium text-gray-700">{job.company}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {job.url && (
                  <a
                    className="btn-outline text-sm"
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View posting
                  </a>
                )}
                <Link href="/dashboard" className="btn-outline text-sm">
                  Back to Dashboard
                </Link>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-gray-600">
              Created {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="text-lg font-semibold">Job description</h3>
            <p className="mt-2 whitespace-pre-wrap text-gray-700">{job.raw_text}</p>
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI analysis</h3>
              <div className="flex gap-2">
                <button
                  className="rounded-lg bg-[var(--primary)] px-3 py-1 text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? "Analyzing..." : "Analyze"}
                </button>
                <button
                  className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm font-medium hover:bg-gray-50"
                  onClick={handleClearAnalysis}
                  disabled={analyzing && comparing}
                >
                  Clear
                </button>
              </div>
            </div>
            {!analysis && <p className="text-gray-600">No analysis yet.</p>}
            {analysis && (
              <div className="space-y-3">
                {analysis.summary && (
                  <div>
                    <p className="text-sm font-medium">Summary</p>
                    <p className="text-gray-700">{analysis.summary}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Required skills</p>
                  {renderList(analysis.skills_required)}
                </div>
                <div>
                  <p className="text-sm font-medium">Nice to have</p>
                  {renderList(analysis.nice_to_have)}
                </div>
                <div>
                  <p className="text-sm font-medium">Checklist</p>
                  {renderList(analysis.checklist)}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Resume gap analysis</h3>
              <Link className="text-sm text-blue-600 underline" href="/privacy">
                Privacy
              </Link>
            </div>
            <p className="text-gray-600 text-sm">
              Paste your resume text. We only send the resume and job description to the AI.
            </p>
            <textarea
              className="min-h-[10rem] w-full rounded-lg border border-[var(--border)] px-3 py-2 focus:border-[var(--primary)] focus:outline-none"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            <button
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-strong)] disabled:opacity-60"
              onClick={handleCompareResume}
              disabled={comparing || resumeText.trim().length === 0}
            >
              {comparing ? "Comparing..." : "Compare Resume"}
            </button>

            {resumeResult && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Missing skills</p>
                  {renderList(resumeResult.missing_skills)}
                </div>
                <div>
                  <p className="text-sm font-medium">2-week learning plan</p>
                  {renderList(resumeResult.learning_plan)}
                </div>
                <div>
                  <p className="text-sm font-medium">Suggested resume bullets</p>
                  {renderList(resumeResult.suggested_bullets)}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
