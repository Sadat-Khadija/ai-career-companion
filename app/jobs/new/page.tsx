"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type JobForm = {
  title: string;
  company: string;
  url: string;
  raw_text: string;
};

const initialForm: JobForm = {
  title: "",
  company: "",
  url: "",
  raw_text: "",
};

export default function NewJobPage() {
  const router = useRouter();
  const [form, setForm] = useState<JobForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        router.push("/login");
      }
    }
    checkSession();
  }, [router]);

  const updateField = (key: keyof JobForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("Please log in to create a job post.");
      router.push("/login");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("job_posts")
      .insert({
        title: form.title.trim(),
        company: form.company.trim(),
        url: form.url.trim() || null,
        raw_text: form.raw_text.trim(),
        user_id: userData.user.id,
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm(initialForm);
    router.push(`/jobs/${data?.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-3xl font-semibold text-[var(--primary)]">Add a Job Posting</h2>
        <p className="text-gray-600">
          Paste a job description to analyze required skills.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 glass-card p-6">
        <div className="grid gap-3">
          <label className="text-sm font-medium">Job title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            required
            placeholder="Senior Frontend Engineer"
          />
        </div>

        <div className="grid gap-3">
          <label className="text-sm font-medium">Company</label>
          <input
            className="input"
            value={form.company}
            onChange={(e) => updateField("company", e.target.value)}
            required
            placeholder="Acme Corp"
          />
        </div>

        <div className="grid gap-3">
          <label className="text-sm font-medium">Job link (optional)</label>
          <input
            className="input"
            value={form.url}
            onChange={(e) => updateField("url", e.target.value)}
            placeholder="https://example.com/jobs/123"
          />
        </div>

        <div className="grid gap-3">
          <label className="text-sm font-medium">Job description</label>
          <textarea
            className="min-h-[12rem] input"
            value={form.raw_text}
            onChange={(e) => updateField("raw_text", e.target.value)}
            required
            placeholder="Paste the full job description here..."
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save job post"}
        </button>
      </form>
    </div>
  );
}
