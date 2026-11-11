import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { getCapabilities } from "@/lib/roles";

type CuratorGate =
  | { ok: false; error: string }
  | {
      ok: true;
      user: { id: string };
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
      curator: SupabaseClient;
      mode: "service" | "user";
    };

async function readAccessTokenFromCookies(): Promise<string | null> {
  try {
    const jar = await cookies();
    const all = jar.getAll();
    const base = all
      .map((c) => c.name)
      .find(
        (name) =>
          name.startsWith("sb-") &&
          name.endsWith("-auth-token") &&
          !name.includes("."),
      );
    if (!base) return null;

    const chunks = all
      .filter((c) => c.name === base || c.name.startsWith(`${base}.`))
      .sort((a, b) => {
        const ai = a.name === base ? -1 : Number(a.name.split(".").pop());
        const bi = b.name === base ? -1 : Number(b.name.split(".").pop());
        return ai - bi;
      });

    const raw = chunks.map((c) => c.value).join("");
    if (!raw) return null;

    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      try {
        parsed = JSON.parse(
          Buffer.from(raw.replace(/^base64-/, ""), "base64").toString("utf8"),
        );
      } catch {
        return null;
      }
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "access_token" in parsed &&
      typeof (parsed as { access_token: unknown }).access_token === "string"
    ) {
      return (parsed as { access_token: string }).access_token;
    }
    return null;
  } catch {
    return null;
  }
}

async function requireTechCurator(): Promise<CuratorGate> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return {
      ok: false,
      error: "Not authenticated. Sign in again, then retry.",
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin, is_suspended, csi_id")
    .eq("id", user.id)
    .maybeSingle();

  const caps = getCapabilities(profile);
  const rosterHead =
    profile?.csi_id === 241 ||
    profile?.csi_id === 246 ||
    profile?.csi_id === 303;

  if (!caps.canReview && !rosterHead) {
    return {
      ok: false,
      error: "Only Technical Heads or Super Admin can curate Tech Weekly.",
    };
  }

  try {
    const curator = createSupabaseServiceRoleClient();
    return { ok: true, user, supabase, curator, mode: "service" };
  } catch {
    // fall through
  }

  const accessToken =
    session?.access_token || (await readAccessTokenFromCookies());

  if (!accessToken) {
    return {
      ok: false,
      error: "Session expired. Sign out and sign in again, then retry.",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return {
      ok: false,
      error: "Missing Supabase public env on the server.",
    };
  }

  const curator = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return { ok: true, user, supabase, curator, mode: "user" };
}

function safeRevalidate(paths: string[]) {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // Never fail a successful curation because cache invalidation threw.
    }
  }
}

export async function curateReviewSubmission(input: {
  submissionId: string;
  status: "approved" | "rejected" | "submitted";
  reviewNote?: string;
}): Promise<{ success: boolean; error?: string }> {
  const gate = await requireTechCurator();
  if (!gate.ok) return { success: false, error: gate.error };

  const note = input.reviewNote?.trim() || null;
  const { data, error } =
    gate.mode === "service"
      ? await gate.curator.rpc("admin_review_tech_submission", {
          p_actor_id: gate.user.id,
          p_submission_id: input.submissionId,
          p_status: input.status,
          p_review_note: note,
        })
      : await gate.curator.rpc("review_tech_submission", {
          p_submission_id: input.submissionId,
          p_status: input.status,
          p_review_note: note,
        });

  if (error || !data) {
    return {
      success: false,
      error: error?.message || "Could not update review status.",
    };
  }

  const result = data as {
    submission_id: string;
    slug: string;
    title: string;
    author_id: string;
  };

  if (result.author_id !== gate.user.id) {
    const twMarker = `\u200bTW:${result.submission_id}`;
    await gate.supabase.from("notifications").insert({
      user_id: result.author_id,
      from_user_id: gate.user.id,
      type: input.status === "approved" ? "review_approved" : "changes_requested",
      message:
        (input.status === "approved"
          ? `Your CSI Tech Weekly article "${result.title}" was approved!`
          : `Review note on "${result.title}": ${input.reviewNote || "Changes requested."}`) +
        twMarker,
    });
  }

  safeRevalidate([
    "/tech-weekly",
    result.slug ? `/tech-weekly/${result.slug}` : "",
    "/tech-weekly/review",
  ].filter(Boolean));

  return { success: true };
}

export async function curateSelectWeeklyPick(input: {
  submissionId: string;
  reviewNote?: string;
}): Promise<{ success: boolean; error?: string; replacedId?: string | null }> {
  const gate = await requireTechCurator();
  if (!gate.ok) return { success: false, error: gate.error };

  const note = input.reviewNote?.trim() || null;
  const { data, error } =
    gate.mode === "service"
      ? await gate.curator.rpc("admin_select_tech_weekly_pick", {
          p_actor_id: gate.user.id,
          p_submission_id: input.submissionId,
          p_review_note: note,
        })
      : await gate.curator.rpc("select_tech_weekly_pick", {
          p_submission_id: input.submissionId,
          p_review_note: note,
        });

  if (error || !data) {
    return {
      success: false,
      error: error?.message || "Could not select weekly pick.",
    };
  }

  const result = data as {
    selected_id: string;
    replaced_id: string | null;
  };

  const { data: sub } = await gate.curator
    .from("tech_submissions")
    .select("id, slug, title, author_id")
    .eq("id", input.submissionId)
    .maybeSingle();

  if (sub && sub.author_id !== gate.user.id) {
    await gate.supabase.from("notifications").insert({
      user_id: sub.author_id,
      from_user_id: gate.user.id,
      type: "review_approved",
      message: `Congratulations! "${sub.title}" was selected as this week's official CSI LinkedIn Pick!\u200bTW:${sub.id}`,
    });
  }

  safeRevalidate(
    ["/", "/tech-weekly", sub?.slug ? `/tech-weekly/${sub.slug}` : "", "/tech-weekly/review"].filter(
      Boolean,
    ),
  );

  return {
    success: true,
    replacedId: result.replaced_id ?? null,
  };
}
