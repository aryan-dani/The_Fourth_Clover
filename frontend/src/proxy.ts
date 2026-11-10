import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
}

/**
 * Paths that need a fresh auth session on the request (cookies + getUser).
 * The matcher below only runs this proxy on these prefixes.
 */
const AUTH_REFRESH_PREFIXES = [
  "/write",
  "/dashboard",
  "/admin",
  "/settings",
  "/notifications",
  "/verify-csi",
  "/reading-list",
  "/following",
  "/tech-weekly/write",
  "/tech-weekly/review",
  "/csi/write",
  "/csi/review",
  "/auth",
];

function needsAuthRefresh(pathname: string): boolean {
  return AUTH_REFRESH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Next.js 16 proxy — refreshes the Supabase auth session on private routes
 * so Server Components / Server Actions see a valid cookie session.
 * Public HTML never enters this file (see matcher).
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  if (!hasSupabaseAuthCookie(request)) {
    return supabaseResponse;
  }

  if (!needsAuthRefresh(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[],
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session if needed. Do not insert logic between createServerClient
  // and getUser — concurrent refresh races can invalidate the session.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/write",
    "/write/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/settings",
    "/settings/:path*",
    "/notifications",
    "/notifications/:path*",
    "/verify-csi",
    "/verify-csi/:path*",
    "/reading-list",
    "/reading-list/:path*",
    "/following",
    "/following/:path*",
    "/tech-weekly/write",
    "/tech-weekly/write/:path*",
    "/tech-weekly/review",
    "/tech-weekly/review/:path*",
    "/csi/write",
    "/csi/write/:path*",
    "/csi/review",
    "/csi/review/:path*",
    "/auth",
    "/auth/:path*",
  ],
};
