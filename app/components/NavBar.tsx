"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export function NavBar() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setIsAuthed(Boolean(data.user));
    }
    load();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setIsAuthed(false);
    router.push("/login");
  }

  return (
    <nav className="border-b border-[var(--border)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={isAuthed ? "/dashboard" : "/login"} className="text-lg font-semibold text-[var(--primary)]">
          AI Career Companion
        </Link>

        <div className="flex gap-3">
          {isAuthed ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:text-[var(--primary)]"
              >
                Dashboard
              </Link>
              <Link
                href="/jobs/new"
                className="rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:text-[var(--primary)]"
              >
                Add Job
              </Link>
              <Link
                href="/settings"
                className="rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:text-[var(--primary)]"
              >
                Settings
              </Link>
              <Link
                href="/privacy"
                className="rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:text-[var(--primary)]"
              >
                Privacy
              </Link>
              <button
                onClick={logout}
                className="rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:text-[var(--primary)]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:text-[var(--primary)]"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:text-[var(--primary)]"
              >
                Sign up
              </Link>
              <Link
                href="/privacy"
                className="rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:text-[var(--primary)]"
              >
                Privacy
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
