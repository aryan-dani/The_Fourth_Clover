import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
}

/**
 * Paths that need a fresh auth session on every request (RSC + actions).
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

function isServerActionRequest(request: NextRequest): boolean {
  return (
    request.method === "POST" &&
    (request.headers.has("next-action") ||
      request.headers.has("Next-Action"))
  );
}

/**
 * Next.js 16 proxy — refreshes the Supabase auth session when needed.
 *
 * Public HTML GETs exit immediately (no getUser) so Netlify edge cache stays
 * valid. Server Actions on public pages (Approve / Weekly Pick on a Tech Weekly
 * article, reactions, comments, etc.) still refresh the session so auth.uid()
 * reaches Postgres.
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

  const pathname = request.nextUrl.pathname;
  if (!needsAuthRefresh(pathname) && !isServerActionRequest(request)) {
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
        headers?: Record<string, string>,
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        // Prevent CDNs from caching Set-Cookie after a token refresh.
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        } else {
          supabaseResponse.headers.set("Cache-Control", "private, no-store");
        }
      },
    },
  });

  // Refresh the session if needed. Do not insert logic between createServerClient
  // and getUser — concurrent refresh races can invalidate the session.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  // Catch-all so Server Actions on public article pages can refresh the session.
  // Anonymous and public GETs return immediately above (no Auth network call).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|webmanifest)$).*)",
  ],
};
