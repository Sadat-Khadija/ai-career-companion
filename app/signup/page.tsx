"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

// Email/password signup screen with Supabase Auth.
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/login` },
    });
    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
    } else {
      setMsg("Check your email to confirm your account, then log in.");
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
      <h1 className="text-2xl font-bold">Sign up</h1>

      <form onSubmit={signUp} className="mt-6 space-y-3">
        <label className="block text-sm font-medium">Email</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-sm font-medium">Password</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
        />

        <label className="block text-sm font-medium">Confirm password</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          type="password"
          required
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
        />

        <button
          className="btn-primary w-full disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Create account"}
        </button>
      </form>

      {msg && <p className="mt-3 text-sm text-gray-600">{msg}</p>}

      <p className="mt-6 text-sm text-gray-700">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
