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
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={isAuthed ? "/dashboard" : "/login"} className="text-lg font-semibold">
          AI Career Companion
        </Link>

        <div className="flex gap-4">
          {isAuthed ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                Dashboard
              </Link>
              <Link
                href="/jobs/new"
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                Add Job
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                Settings
              </Link>
              <Link
                href="/privacy"
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                Privacy
              </Link>
              <button
                onClick={logout}
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                Sign up
              </Link>
              <Link
                href="/privacy"
                className="text-sm font-medium text-gray-700 hover:text-black"
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
