"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md glass-card p-8">
      <h1 className="text-2xl font-bold text-[var(--primary)]">Login</h1>

      <form onSubmit={signIn} className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          className="input w-full"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          className="input w-full"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="btn-primary w-full disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}

      <p className="mt-6 text-sm text-gray-700">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-blue-600 underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
