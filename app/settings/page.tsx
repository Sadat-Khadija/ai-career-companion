"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login");
        return;
      }
      setEmail(data.user.email ?? "");
    }
    loadUser();
  }, [router]);

  async function deleteAllData() {
    const confirm = window.confirm(
      "This will delete all your job posts and analyses. This cannot be undone. Continue?",
    );
    if (!confirm) return;
    setLoading(true);
    setStatus("");

    const { error } = await supabase.from("job_posts").delete().neq("id", "");
    setLoading(false);

    if (error) {
      setStatus(error.message);
    } else {
      setStatus("All job posts and analyses deleted.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[var(--primary)]">Settings</h1>
        <p className="text-gray-600">Manage your data and privacy.</p>
      </div>

      <div className="glass-card p-5 space-y-3">
        <p className="text-sm text-gray-700">
          Signed in as <span className="font-medium">{email || "Unknown"}</span>
        </p>
        <button
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          onClick={deleteAllData}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete all data"}
        </button>
        {status && <p className="text-sm text-gray-700">{status}</p>}
      </div>
    </div>
  );
}
