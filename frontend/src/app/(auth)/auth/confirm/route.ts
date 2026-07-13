import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/auth/reset-password";
  }
  return raw;
}

/**
 * Completes email-link auth (recovery, signup confirm, magic link) via token_hash.
 * Prefer this over PKCE `?code=` for email links — Gmail prefetch often burns the
 * code without a code_verifier, which causes "both auth code and code verifier
 * should be non-empty".
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");

  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(`/auth/reset-password?error=${encodeURIComponent(reason)}`, origin),
    );

  try {
    const supabase = await createSupabaseServerClient();

    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });
      if (error) {
        console.error("verifyOtp failed:", error.message);
        return fail("invalid_or_expired");
      }
      return NextResponse.redirect(new URL(next, origin));
    }

    // Legacy / accidental PKCE landings on this route
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("exchangeCodeForSession failed:", error.message);
        return fail("pkce_failed");
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  } catch (err) {
    console.error("auth/confirm error:", err);
    return fail("confirm_failed");
  }

  return fail("missing_token");
}
