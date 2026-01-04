import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

const PROTECTED = ["/dashboard", "/jobs", "/settings"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or anon key for middleware.");
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name) {
        return req.cookies.get(name)?.value;
      },
      getAll() {
        return req.cookies.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      set(name, value, options) {
        res.cookies.set({
          name,
          value,
          ...options,
        });
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        });
      },
    },
  });

  // Refresh the session if needed
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isProtected = PROTECTED.some(
    (path) =>
      req.nextUrl.pathname === path ||
      req.nextUrl.pathname.startsWith(`${path}/`),
  );

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/jobs/:path*", "/settings/:path*"],
};
