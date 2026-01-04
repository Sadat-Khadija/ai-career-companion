"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [jobs, setJobs] = useState<
    Array<{ id: string; title: string; company: string; created_at: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      // If not logged in, send them to login
      if (error || !data.user) {
        router.push("/login");
        return;
      }

      setEmail(data.user.email ?? "");

      const { data: jobsData, error: jobsError } = await supabase
        .from("job_posts")
        .select("id,title,company,created_at")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });

      if (jobsError) {
        setError(jobsError.message);
      } else {
        setJobs(jobsData ?? []);
      }
      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="flex items-center gap-3">
          <Link
            href="/jobs/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add Job
          </Link>
          <button
            onClick={logout}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>

      <p className="text-gray-600">
        Logged in as: <span className="font-medium">{email || "Unknown"}</span>
      </p>

      <div className="rounded-xl border bg-white p-5">
        {loading && <p className="text-gray-600">Loading jobs...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && jobs.length === 0 && (
          <div className="space-y-2">
            <p className="text-gray-600">No job posts yet. Create one to get started.</p>
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Add your first job
            </Link>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <ul className="divide-y">
            {jobs.map((job) => (
              <li key={job.id} className="py-3">
                <Link href={`/jobs/${job.id}`} className="block">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-gray-600">
                    {job.company} — {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
