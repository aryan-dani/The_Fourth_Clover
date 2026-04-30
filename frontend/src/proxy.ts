import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEV_ONLY_PREFIXES = ["/test-connection", "/query"];

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (
    DEV_ONLY_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/test-connection",
    "/query",
    "/test-connection/:path*",
    "/query/:path*",
  ],
};
