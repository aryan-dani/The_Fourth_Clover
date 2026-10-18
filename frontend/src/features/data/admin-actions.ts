"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AuditLogEntry,
  CsiRole,
  CsiRosterEntry,
  PlatformSettings,
  PostWithAuthor,
  Profile,
  TechCommentWithAuthor,
  TechReport,
  TechSubmissionWithAuthor,
} from "@/types/database";

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { authorized: false as const, supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const superEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase();

  const isSuper =
    !profile?.is_suspended &&
    (profile?.role === "super_admin" ||
      profile?.csi_id === 303 ||
      Boolean(profile?.is_admin) ||
      Boolean(superEmail && userEmail && superEmail === userEmail));

  return {
    authorized: isSuper,
    supabase,
    user,
    profile: (profile as Profile | null) ?? null,
  };
}

export type SuperAdminDashboardPayload = {
  authorized: boolean;
  viewerProfile: Profile | null;
  users: Profile[];
  roster: CsiRosterEntry[];
  submissions: TechSubmissionWithAuthor[];
  comments: TechCommentWithAuthor[];
  reports: TechReport[];
  settings: PlatformSettings;
  auditLogs: (AuditLogEntry & {
    actor?: { username: string; full_name: string | null; csi_id: number | null } | null;
  })[];
  legacyPosts: PostWithAuthor[];
};

const FALLBACK_SETTINGS: PlatformSettings = {
  id: 1,
  cutoff_day: 3,
  cutoff_hour_ist: 9,
  cutoff_minute_ist: 0,
  posts_per_week: 1,
  allow_member_comments: false,
  submissions_override: "auto",
  updated_at: new Date(0).toISOString(),
  updated_by: null,
};

export async function fetchSuperAdminDashboardData(): Promise<SuperAdminDashboardPayload> {
  const { authorized, supabase, profile } = await requireSuperAdmin();

  if (!authorized) {
    return {
      authorized: false,
      viewerProfile: profile,
      users: [],
      roster: [],
      submissions: [],
      comments: [],
      reports: [],
      settings: FALLBACK_SETTINGS,
      auditLogs: [],
      legacyPosts: [],
    };
  }

  const [
    usersRes,
    rosterRes,
    subsRes,
    commentsRes,
    reportsRes,
    settingsRes,
    auditRes,
    postsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("csi_roster")
      .select(
        "csi_id, name, dept, year, prn_missing, prn_duplicate, role, claimed_by, claimed_at, created_at, updated_at"
      )
      .order("csi_id", { ascending: true })
      .limit(500),
    supabase
      .from("tech_submissions")
      .select(
        `
        *,
        author:profiles!tech_submissions_author_id_fkey (
          id, username, full_name, avatar_url, bio, csi_id, role, dept, year
        ),
        week:tech_weeks!tech_submissions_week_id_fkey (*)
      `
      )
      .order("created_at", { ascending: false })
      .limit(150),
    supabase
      .from("tech_comments")
      .select(
        `
        *,
        author:profiles!tech_comments_user_id_fkey (
          id, username, full_name, avatar_url, bio, csi_id, role, dept, year
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("tech_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150),
    supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles!posts_author_id_fkey (
          id, username, full_name, avatar_url, bio
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const users = (usersRes.data || []) as Profile[];
  const userById = new Map(users.map((u) => [u.id, u]));

  const auditLogs = ((auditRes.data || []) as AuditLogEntry[]).map((entry) => {
    const actor = entry.actor_id ? userById.get(entry.actor_id) : undefined;
    return {
      ...entry,
      actor: actor
        ? {
            username: actor.username,
            full_name: actor.full_name,
            csi_id: actor.csi_id ?? null,
          }
        : null,
    };
  });

  return {
    authorized: true,
    viewerProfile: profile,
    users,
    roster: (rosterRes.data || []) as CsiRosterEntry[],
    submissions: (subsRes.data || []) as unknown as TechSubmissionWithAuthor[],
    comments: (commentsRes.data || []) as unknown as TechCommentWithAuthor[],
    reports: (reportsRes.data || []) as TechReport[],
    settings:
      (settingsRes.data as PlatformSettings | null) || FALLBACK_SETTINGS,
    auditLogs,
    legacyPosts: (postsRes.data || []) as unknown as PostWithAuthor[],
  };
}

export async function adminAssignCsiIdentityAction(input: {
  targetUserId: string;
  csiId: number | null;
  overrideRole?: CsiRole | null;
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, supabase } = await requireSuperAdmin();
  if (!authorized) {
    return { success: false, error: "Super Admin authorization required." };
  }

  const { error } = await supabase.rpc("admin_assign_csi_identity", {
    p_target_user_id: input.targetUserId,
    p_csi_id: input.csiId,
    p_override_role: input.overrideRole ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/tech-weekly");
  return { success: true };
}

export async function adminToggleUserSuspensionAction(input: {
  targetUserId: string;
  suspend: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, supabase, user } = await requireSuperAdmin();
  if (!authorized || !user) {
    return { success: false, error: "Super Admin authorization required." };
  }

  const { data: beforeProfile } = await supabase
    .from("profiles")
    .select("id, username, role, csi_id, is_suspended")
    .eq("id", input.targetUserId)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ is_suspended: input.suspend })
    .eq("id", input.targetUserId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: input.suspend ? "admin_suspend_user" : "admin_unsuspend_user",
    target_type: "profile",
    target_id: input.targetUserId,
    before_state: beforeProfile || null,
    after_state: { is_suspended: input.suspend },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function adminSoftDeleteSubmissionAction(input: {
  submissionId: string;
  restore?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, supabase, user } = await requireSuperAdmin();
  if (!authorized || !user) {
    return { success: false, error: "Super Admin authorization required." };
  }

  const isDeleted = !input.restore;
  const { data: beforeSub } = await supabase
    .from("tech_submissions")
    .select("id, title, slug, status, is_deleted")
    .eq("id", input.submissionId)
    .maybeSingle();

  const { error } = await supabase
    .from("tech_submissions")
    .update({
      is_deleted: isDeleted,
      deleted_by: isDeleted ? user.id : null,
      deleted_at: isDeleted ? new Date().toISOString() : null,
    })
    .eq("id", input.submissionId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: isDeleted
      ? "admin_soft_delete_submission"
      : "admin_restore_submission",
    target_type: "tech_submission",
    target_id: input.submissionId,
    before_state: beforeSub || null,
    after_state: { is_deleted: isDeleted },
  });

  revalidatePath("/admin");
  revalidatePath("/tech-weekly");
  if (beforeSub?.slug) revalidatePath(`/tech-weekly/${beforeSub.slug}`);
  return { success: true };
}

export async function adminSoftDeleteCommentAction(input: {
  commentId: string;
  restore?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, supabase, user } = await requireSuperAdmin();
  if (!authorized || !user) {
    return { success: false, error: "Super Admin authorization required." };
  }

  const isDeleted = !input.restore;
  const { data: beforeComment } = await supabase
    .from("tech_comments")
    .select("id, content, is_deleted")
    .eq("id", input.commentId)
    .maybeSingle();

  const { error } = await supabase
    .from("tech_comments")
    .update({
      is_deleted: isDeleted,
      deleted_by: isDeleted ? user.id : null,
      deleted_at: isDeleted ? new Date().toISOString() : null,
    })
    .eq("id", input.commentId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: isDeleted ? "admin_soft_delete_comment" : "admin_restore_comment",
    target_type: "tech_comment",
    target_id: input.commentId,
    before_state: beforeComment || null,
    after_state: { is_deleted: isDeleted },
  });

  revalidatePath("/admin");
  revalidatePath("/tech-weekly");
  return { success: true };
}

export async function adminResolveReportAction(input: {
  reportId: string;
  status: "resolved" | "dismissed";
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, supabase, user } = await requireSuperAdmin();
  if (!authorized || !user) {
    return { success: false, error: "Super Admin authorization required." };
  }

  const { error } = await supabase
    .from("tech_reports")
    .update({
      status: input.status,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", input.reportId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: `admin_report_${input.status}`,
    target_type: "tech_report",
    target_id: input.reportId,
    after_state: { status: input.status },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function adminUpdatePlatformSettingsAction(input: {
  cutoff_day: number;
  cutoff_hour_ist: number;
  cutoff_minute_ist: number;
  posts_per_week: number;
  allow_member_comments: boolean;
  submissions_override: "auto" | "force_open" | "force_closed";
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, supabase, user } = await requireSuperAdmin();
  if (!authorized || !user) {
    return { success: false, error: "Super Admin authorization required." };
  }

  const { data: beforeSettings } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const payload = {
    cutoff_day: Math.min(6, Math.max(0, Math.floor(input.cutoff_day))),
    cutoff_hour_ist: Math.min(23, Math.max(0, Math.floor(input.cutoff_hour_ist))),
    cutoff_minute_ist: Math.min(
      59,
      Math.max(0, Math.floor(input.cutoff_minute_ist))
    ),
    posts_per_week: Math.min(10, Math.max(1, Math.floor(input.posts_per_week))),
    allow_member_comments: Boolean(input.allow_member_comments),
    submissions_override: input.submissions_override,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const { error } = await supabase
    .from("platform_settings")
    .update(payload)
    .eq("id", 1);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "admin_update_platform_settings",
    target_type: "platform_settings",
    target_id: "1",
    before_state: beforeSettings || null,
    after_state: payload,
  });

  revalidatePath("/admin");
  revalidatePath("/tech-weekly");
  revalidatePath("/tech-weekly/write");
  revalidatePath("/tech-weekly/review");
  return { success: true };
}
