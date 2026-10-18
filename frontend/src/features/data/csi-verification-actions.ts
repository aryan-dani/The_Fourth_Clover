"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { CsiRole } from "@/types/database";

const DEFAULT_PRN_HMAC_SECRET =
  "csi-mitwpu-fourth-clover-hmac-secret-2026";

const verifyCsiSchema = z.object({
  csiId: z.coerce
    .number()
    .int("CSI ID must be a whole number.")
    .min(1, "Please enter a valid CSI ID.")
    .max(999999, "Please enter a valid CSI ID."),
  prn: z
    .string()
    .trim()
    .min(4, "Please enter your university PRN.")
    .max(32, "Please enter a valid university PRN."),
});

const GENERIC_VERIFY_ERROR =
  "Verification failed. Please check your CSI ID and PRN, or contact the Technical Secretary.";

function hashValue(val: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(val.trim())
    .digest("hex");
}

function getEffectivePrnSecret(): string {
  const envSecret = process.env.PRN_HASH_SECRET?.trim();
  return envSecret && envSecret.length >= 16
    ? envSecret
    : DEFAULT_PRN_HMAC_SECRET;
}

async function getHashedClientIp(): Promise<string> {
  try {
    const hdrs = await headers();
    const forwarded = hdrs.get("x-forwarded-for");
    const realIp = hdrs.get("x-real-ip");
    const rawIp = forwarded?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
    return hashValue(rawIp, getEffectivePrnSecret()).slice(0, 32);
  } catch {
    return "unknown";
  }
}

/**
 * Called after Google sign-in to check if the authenticated user matches SUPER_ADMIN_EMAIL
 * (from server env var, never hardcoded) and return the current verification state.
 */
export async function syncUserVerificationStatusAction(): Promise<{
  authenticated: boolean;
  verified: boolean;
  role: CsiRole;
  csiId: number | null;
  dept: string | null;
  year: string | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return {
        authenticated: false,
        verified: false,
        role: "unverified",
        csiId: null,
        dept: null,
        year: null,
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, csi_id, role, dept, year, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = user.email?.trim().toLowerCase();

    if (
      superAdminEmail &&
      userEmail &&
      superAdminEmail === userEmail &&
      profile?.role !== "super_admin"
    ) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        const adminClient = createClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        await adminClient.rpc("admin_assign_csi_identity", {
          p_target_user_id: user.id,
          p_csi_id: 303,
          p_override_role: "super_admin",
        });
        revalidatePath("/tech-weekly");
        revalidatePath("/admin");
        return {
          authenticated: true,
          verified: true,
          role: "super_admin",
          csiId: 303,
          dept: "Tech",
          year: profile?.year ?? null,
        };
      }
    }

    const role = (profile?.role as CsiRole) || "unverified";
    const csiId = profile?.csi_id ?? null;
    const verified =
      Boolean(csiId && role !== "unverified") || Boolean(profile?.is_admin);

    return {
      authenticated: true,
      verified,
      role: profile?.is_admin && role === "unverified" ? "super_admin" : role,
      csiId,
      dept: profile?.dept ?? null,
      year: profile?.year ?? null,
    };
  } catch {
    return {
      authenticated: false,
      verified: false,
      role: "unverified",
      csiId: null,
      dept: null,
      year: null,
    };
  }
}

/**
 * Verifies a user's CSI ID + PRN (2-factor check) against the server-side roster.
 * Never reveals whether a CSI ID exists, has a missing/duplicate PRN, or is already claimed.
 */
export async function verifyCsiIdentityAction(rawInput: {
  csiId: number | string;
  prn: string;
}): Promise<{
  success: boolean;
  error?: string;
  role?: CsiRole;
  csiId?: number;
  dept?: string | null;
  year?: string | null;
}> {
  const parsed = verifyCsiSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || GENERIC_VERIFY_ERROR,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return {
        success: false,
        error: "Please sign in with Google first.",
      };
    }

    const normalizedPrn = parsed.data.prn.trim().replace(/\s+/g, "");
    const prnHash = hashValue(normalizedPrn, getEffectivePrnSecret());
    const ipHash = await getHashedClientIp();

    const { data, error } = await supabase.rpc("claim_csi_identity", {
      p_csi_id: parsed.data.csiId,
      p_prn_hash: prnHash,
      p_ip_hash: ipHash,
    });

    if (error || !data) {
      return {
        success: false,
        error: GENERIC_VERIFY_ERROR,
      };
    }

    const result = data as {
      success: boolean;
      error?: string;
      role?: CsiRole;
      csi_id?: number;
      dept?: string | null;
      year?: string | null;
    };

    if (!result.success) {
      return {
        success: false,
        error: result.error || GENERIC_VERIFY_ERROR,
      };
    }

    revalidatePath("/");
    revalidatePath("/verify-csi");
    revalidatePath("/tech-weekly");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      role: result.role,
      csiId: result.csi_id,
      dept: result.dept ?? null,
      year: result.year ?? null,
    };
  } catch {
    return {
      success: false,
      error: GENERIC_VERIFY_ERROR,
    };
  }
}
