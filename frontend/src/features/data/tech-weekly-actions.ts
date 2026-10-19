"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createSupabaseServerClient,
  createSupabasePublicServerClient,
} from "@/lib/supabase/server";
import type {
  CsiRole,
  PlatformSettings,
  TechAuthorBadge,
  TechCommentWithAuthor,
  TechReactionType,
  TechSubmissionStatus,
  TechSubmissionWithAuthor,
  TechWeek,
} from "@/types/database";

const AUTHOR_BADGE_SELECT = `
  id,
  username,
  full_name,
  avatar_url,
  bio,
  csi_id,
  role,
  dept,
  year
`;

export type LeaderboardEntry = {
  author: TechAuthorBadge;
  submissionsCount: number;
  selectedCount: number;
  reactionsReceived: number;
  streakWeeks: number;
  score: number;
};

export type TechWeeklyLandingPayload = {
  currentWeek: TechWeek | null;
  allWeeks: TechWeek[];
  settings: PlatformSettings;
  isWindowOpen: boolean;
  featuredPick: TechSubmissionWithAuthor | null;
  submissions: TechSubmissionWithAuthor[];
  leaderboard: LeaderboardEntry[];
};

const DEFAULT_SETTINGS: PlatformSettings = {
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

function countWords(text: string): number {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return 0;
  return trimmed.split(" ").length;
}

function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "tech-weekly"}-${suffix}`;
}

function computeIsWindowOpen(
  week: TechWeek | null,
  settings: PlatformSettings
): boolean {
  if (settings.submissions_override === "force_open") return true;
  if (settings.submissions_override === "force_closed") return false;
  if (!week || week.is_locked) return false;
  const nowMs = Date.now();
  const startsMs = new Date(week.starts_at).getTime();
  const cutoffMs = new Date(week.cutoff_at).getTime();
  return nowMs >= startsMs && nowMs <= cutoffMs;
}

export async function fetchTechWeeklyLandingData(): Promise<TechWeeklyLandingPayload> {
  const supabase = createSupabasePublicServerClient();

  const [currentWeekRpcRes, weeksRes, settingsRes, submissionsRes] =
    await Promise.all([
      supabase.rpc("get_or_create_current_tech_week"),
      supabase
        .from("tech_weeks")
        .select("*")
        .order("starts_at", { ascending: false })
        .limit(26),
      supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("tech_submissions")
        .select(
          `
          id, week_id, author_id, title, slug, summary, cover_image, tags, word_count,
          status, selected_by, selected_at, reviewed_by, reviewed_at, review_note,
          is_deleted, created_at, updated_at,
          author:profiles!tech_submissions_author_id_fkey (${AUTHOR_BADGE_SELECT}),
          week:tech_weeks!tech_submissions_week_id_fkey (*)
        `
        )
        .eq("is_deleted", false)
        .in("status", ["submitted", "approved", "selected", "archived"])
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

  const submissionIds = (submissionsRes.data || []).map((s) => s.id as string);
  const [reactionsRes, commentsRes] =
    submissionIds.length === 0
      ? [
          { data: [] as { submission_id: string; reaction_type: string }[] },
          { data: [] as { submission_id: string }[] },
        ]
      : await Promise.all([
          supabase
            .from("tech_reactions")
            .select("submission_id, reaction_type")
            .in("submission_id", submissionIds),
          supabase
            .from("tech_comments")
            .select("submission_id")
            .eq("is_deleted", false)
            .in("submission_id", submissionIds),
        ]);

  const rawWeeks = (weeksRes.data || []) as TechWeek[];
  const rpcWeek = (currentWeekRpcRes.data as TechWeek | null) ?? null;
  const allWeeks =
    rpcWeek && !rawWeeks.some((w) => w.id === rpcWeek.id)
      ? [rpcWeek, ...rawWeeks]
      : rawWeeks;
  const currentWeek = rpcWeek || allWeeks[0] || null;
  const settings =
    (settingsRes.data as PlatformSettings | null) || DEFAULT_SETTINGS;

  const isWindowOpen = computeIsWindowOpen(currentWeek, settings);

  // Aggregate reaction counts per submission
  const reactionMap = new Map<
    string,
    { like: number; insightful: number; fire: number; total: number }
  >();
  for (const r of reactionsRes.data || []) {
    const entry = reactionMap.get(r.submission_id) || {
      like: 0,
      insightful: 0,
      fire: 0,
      total: 0,
    };
    if (r.reaction_type === "like") entry.like += 1;
    if (r.reaction_type === "insightful") entry.insightful += 1;
    if (r.reaction_type === "fire") entry.fire += 1;
    entry.total += 1;
    reactionMap.set(r.submission_id, entry);
  }

  // Aggregate comment counts per submission
  const commentMap = new Map<string, number>();
  for (const c of commentsRes.data || []) {
    commentMap.set(c.submission_id, (commentMap.get(c.submission_id) || 0) + 1);
  }

  const submissions: TechSubmissionWithAuthor[] = (
    (submissionsRes.data || []) as unknown as TechSubmissionWithAuthor[]
  )
    .filter((s) => Boolean(s.author))
    .map((s) => ({
      ...s,
      reaction_counts: reactionMap.get(s.id) || {
        like: 0,
        insightful: 0,
        fire: 0,
        total: 0,
      },
      comment_count: commentMap.get(s.id) || 0,
    }));

  // Find featured pick (current week selected post, or latest selected post)
  const featuredPick =
    submissions.find(
      (s) => s.status === "selected" && currentWeek && s.week_id === currentWeek.id
    ) ||
    submissions.find((s) => s.status === "selected") ||
    null;

  // Compute Leaderboard
  const authorStatsMap = new Map<
    string,
    {
      author: TechAuthorBadge;
      submissionsCount: number;
      selectedCount: number;
      reactionsReceived: number;
      weekKeys: Set<string>;
    }
  >();

  for (const sub of submissions) {
    const existing = authorStatsMap.get(sub.author_id) || {
      author: sub.author,
      submissionsCount: 0,
      selectedCount: 0,
      reactionsReceived: 0,
      weekKeys: new Set<string>(),
    };
    existing.submissionsCount += 1;
    if (sub.status === "selected" || sub.selected_at) {
      existing.selectedCount += 1;
    }
    existing.reactionsReceived += sub.reaction_counts?.total || 0;
    if (sub.week?.week_key) {
      existing.weekKeys.add(sub.week.week_key);
    } else {
      existing.weekKeys.add(sub.week_id);
    }
    authorStatsMap.set(sub.author_id, existing);
  }

  const leaderboard: LeaderboardEntry[] = Array.from(authorStatsMap.values())
    .map((item) => {
      const streakWeeks = item.weekKeys.size;
      const score =
        item.selectedCount * 25 +
        item.submissionsCount * 10 +
        item.reactionsReceived * 2 +
        streakWeeks * 5;
      return {
        author: item.author,
        submissionsCount: item.submissionsCount,
        selectedCount: item.selectedCount,
        reactionsReceived: item.reactionsReceived,
        streakWeeks,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  return {
    currentWeek,
    allWeeks,
    settings,
    isWindowOpen,
    featuredPick,
    submissions,
    leaderboard,
  };
}

export async function fetchFeaturedTechWeeklyPost(): Promise<TechSubmissionWithAuthor | null> {
  try {
    const supabase = createSupabasePublicServerClient();
    const { data } = await supabase
      .from("tech_submissions")
      .select(
        `
        *,
        author:profiles!tech_submissions_author_id_fkey (${AUTHOR_BADGE_SELECT}),
        week:tech_weeks!tech_submissions_week_id_fkey (*)
      `
      )
      .eq("is_deleted", false)
      .eq("status", "selected")
      .order("selected_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return data as unknown as TechSubmissionWithAuthor;
  } catch {
    return null;
  }
}

const getTechSubmissionDetailCached = cache(
  async (
    slug: string
  ): Promise<{
    submission: TechSubmissionWithAuthor | null;
    comments: TechCommentWithAuthor[];
    viewerReactions: TechReactionType[];
    allowMemberComments: boolean;
  }> => {
    const authSupabase = await createSupabaseServerClient();

    const [
      {
        data: { user },
      },
      { data: settingsRow },
      { data: subData },
    ] = await Promise.all([
      authSupabase.auth.getUser(),
      authSupabase
        .from("platform_settings")
        .select("allow_member_comments")
        .eq("id", 1)
        .maybeSingle(),
      authSupabase
        .from("tech_submissions")
        .select(
          `
          *,
          author:profiles!tech_submissions_author_id_fkey (${AUTHOR_BADGE_SELECT}),
          week:tech_weeks!tech_submissions_week_id_fkey (*)
        `
        )
        .eq("slug", slug)
        .maybeSingle(),
    ]);

    const allowMemberComments = Boolean(settingsRow?.allow_member_comments);

    if (!subData) {
      return {
        submission: null,
        comments: [],
        viewerReactions: [],
        allowMemberComments,
      };
    }

    const submission = subData as unknown as TechSubmissionWithAuthor;

    const [reactionsRes, commentsRes] = await Promise.all([
      authSupabase
        .from("tech_reactions")
        .select("user_id, reaction_type")
        .eq("submission_id", submission.id),
      authSupabase
        .from("tech_comments")
        .select(
          `
          *,
          author:profiles!tech_comments_user_id_fkey (${AUTHOR_BADGE_SELECT})
        `
        )
        .eq("submission_id", submission.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true }),
    ]);

    const counts = { like: 0, insightful: 0, fire: 0, total: 0 };
    const viewerReactions: TechReactionType[] = [];

    for (const r of reactionsRes.data || []) {
      if (r.reaction_type === "like") counts.like += 1;
      if (r.reaction_type === "insightful") counts.insightful += 1;
      if (r.reaction_type === "fire") counts.fire += 1;
      counts.total += 1;
      if (user?.id && r.user_id === user.id) {
        viewerReactions.push(r.reaction_type as TechReactionType);
      }
    }

    submission.reaction_counts = counts;

    const flatComments = (
      (commentsRes.data || []) as unknown as TechCommentWithAuthor[]
    ).filter((c) => Boolean(c.author));

    submission.comment_count = flatComments.length;

    // Build 1-level threaded tree
    const topLevel: TechCommentWithAuthor[] = [];
    const byId = new Map<string, TechCommentWithAuthor>();

    for (const c of flatComments) {
      c.replies = [];
      byId.set(c.id, c);
    }
    for (const c of flatComments) {
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.replies!.push(c);
      } else {
        topLevel.push(c);
      }
    }

    return {
      submission,
      comments: topLevel,
      viewerReactions,
      allowMemberComments,
    };
  }
);

export async function fetchTechSubmissionDetailBySlug(slug: string) {
  return getTechSubmissionDetailCached(slug);
}

const saveSubmissionSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters.")
    .max(200, "Title must be at most 200 characters."),
  summary: z
    .string()
    .trim()
    .max(400, "Summary must be at most 400 characters.")
    .optional()
    .nullable(),
  content: z
    .string()
    .trim()
    .min(20, "Article body is too short."),
  coverImage: z.string().url().optional().nullable().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(32)).max(8).optional(),
  status: z.enum(["draft", "submitted"]),
});

export async function saveTechSubmissionAction(
  rawInput: z.infer<typeof saveSubmissionSchema>
): Promise<{
  success: boolean;
  error?: string;
  submission?: TechSubmissionWithAuthor;
}> {
  const parsed = saveSubmissionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid submission input.",
    };
  }

  const wordCount = countWords(parsed.data.content);
  if (wordCount > 2000) {
    return {
      success: false,
      error: `Article exceeds the 2000-word maximum cap (current: ${wordCount} words).`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { success: false, error: "Please sign in with Google first." };
  }

  const { data: currentWeek } = await supabase.rpc(
    "get_or_create_current_tech_week"
  );
  if (!currentWeek?.id) {
    return {
      success: false,
      error: "Could not resolve the active Tech Weekly cycle.",
    };
  }

  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("tech_submissions")
      .update({
        title: parsed.data.title,
        summary: parsed.data.summary || null,
        content: parsed.data.content,
        cover_image: parsed.data.coverImage || null,
        tags: parsed.data.tags || [],
        word_count: wordCount,
        read_time: readTime,
        status: parsed.data.status,
      })
      .eq("id", parsed.data.id)
      .select(
        `
        *,
        author:profiles!tech_submissions_author_id_fkey (${AUTHOR_BADGE_SELECT})
      `
      )
      .single();

    if (error || !data) {
      return {
        success: false,
        error: error?.message || "Failed to update submission.",
      };
    }

    revalidatePath("/tech-weekly");
    revalidatePath(`/tech-weekly/${data.slug}`);
    revalidatePath("/tech-weekly/review");
    return {
      success: true,
      submission: data as unknown as TechSubmissionWithAuthor,
    };
  }

  const slug = slugifyTitle(parsed.data.title);
  const { data, error } = await supabase
    .from("tech_submissions")
    .insert({
      week_id: currentWeek.id,
      author_id: user.id,
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary || null,
      content: parsed.data.content,
      cover_image: parsed.data.coverImage || null,
      tags: parsed.data.tags || [],
      word_count: wordCount,
      read_time: readTime,
      status: parsed.data.status,
    })
    .select(
      `
      *,
      author:profiles!tech_submissions_author_id_fkey (${AUTHOR_BADGE_SELECT})
    `
    )
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message || "Failed to create submission.",
    };
  }

  revalidatePath("/tech-weekly");
  revalidatePath(`/tech-weekly/${data.slug}`);
  revalidatePath("/tech-weekly/review");
  return {
    success: true,
    submission: data as unknown as TechSubmissionWithAuthor,
  };
}

export async function reviewTechSubmissionAction(input: {
  submissionId: string;
  status: "approved" | "rejected" | "submitted";
  reviewNote?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { success: false, error: "Not authenticated." };
  }

  const { data: sub, error } = await supabase
    .from("tech_submissions")
    .update({
      status: input.status,
      review_note: input.reviewNote?.trim() || null,
    })
    .eq("id", input.submissionId)
    .select("id, slug, title, author_id")
    .single();

  if (error || !sub) {
    return {
      success: false,
      error: error?.message || "Failed to update submission review status.",
    };
  }

  if (sub.author_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: sub.author_id,
      from_user_id: user.id,
      type: input.status === "approved" ? "review_approved" : "changes_requested",
      message:
        input.status === "approved"
          ? `Your CSI Tech Weekly article "${sub.title}" was approved!`
          : `Review note on "${sub.title}": ${input.reviewNote || "Changes requested."}`,
    });
  }

  revalidatePath("/tech-weekly");
  revalidatePath(`/tech-weekly/${sub.slug}`);
  revalidatePath("/tech-weekly/review");
  return { success: true };
}

export async function selectTechWeeklyPickAction(input: {
  submissionId: string;
  reviewNote?: string;
}): Promise<{
  success: boolean;
  error?: string;
  replacedId?: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { success: false, error: "Not authenticated." };
  }

  const { data, error } = await supabase.rpc("select_tech_weekly_pick", {
    p_submission_id: input.submissionId,
    p_review_note: input.reviewNote?.trim() || null,
  });

  if (error || !data) {
    return {
      success: false,
      error:
        error?.message ||
        "Only CSI Technical Heads (241, 246) or Super Admin (303) can select the Weekly LinkedIn Pick.",
    };
  }

  const result = data as {
    success: boolean;
    selected_id: string;
    replaced_id: string | null;
  };

  const { data: sub } = await supabase
    .from("tech_submissions")
    .select("id, slug, title, author_id")
    .eq("id", input.submissionId)
    .maybeSingle();

  if (sub && sub.author_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: sub.author_id,
      from_user_id: user.id,
      type: "review_approved",
      message: `Congratulations! "${sub.title}" was selected as this week's official CSI LinkedIn Pick!`,
    });
  }

  revalidatePath("/");
  revalidatePath("/tech-weekly");
  if (sub?.slug) revalidatePath(`/tech-weekly/${sub.slug}`);
  revalidatePath("/tech-weekly/review");

  return {
    success: true,
    replacedId: result.replaced_id ?? null,
  };
}

export async function toggleTechReactionAction(input: {
  submissionId: string;
  reactionType: TechReactionType;
  slug?: string;
}): Promise<{ success: boolean; added?: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { success: false, error: "Sign in to react to submissions." };
  }

  const { data: existing } = await supabase
    .from("tech_reactions")
    .select("id")
    .eq("submission_id", input.submissionId)
    .eq("user_id", user.id)
    .eq("reaction_type", input.reactionType)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("tech_reactions")
      .delete()
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/tech-weekly");
    if (input.slug) revalidatePath(`/tech-weekly/${input.slug}`);
    return { success: true, added: false };
  }

  const { error } = await supabase.from("tech_reactions").insert({
    submission_id: input.submissionId,
    user_id: user.id,
    reaction_type: input.reactionType,
  });

  if (error) {
    return {
      success: false,
      error:
        error.message ||
        "Verify your CSI ID to use technical reactions.",
    };
  }

  revalidatePath("/tech-weekly");
  if (input.slug) revalidatePath(`/tech-weekly/${input.slug}`);
  return { success: true, added: true };
}

export async function addTechCommentAction(input: {
  submissionId: string;
  content: string;
  parentId?: string | null;
  slug?: string;
}): Promise<{
  success: boolean;
  error?: string;
  comment?: TechCommentWithAuthor;
}> {
  const trimmed = input.content.trim();
  if (!trimmed || trimmed.length > 2000) {
    return {
      success: false,
      error: "Comment must be between 1 and 2000 characters.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { success: false, error: "Please sign in to comment." };
  }

  const { data, error } = await supabase
    .from("tech_comments")
    .insert({
      submission_id: input.submissionId,
      user_id: user.id,
      parent_id: input.parentId || null,
      content: trimmed,
    })
    .select(
      `
      *,
      author:profiles!tech_comments_user_id_fkey (${AUTHOR_BADGE_SELECT})
    `
    )
    .single();

  if (error || !data) {
    return {
      success: false,
      error:
        error?.message ||
        "Only verified CSI Technical members can comment right now.",
    };
  }

  if (input.slug) revalidatePath(`/tech-weekly/${input.slug}`);
  revalidatePath("/tech-weekly");

  return {
    success: true,
    comment: data as unknown as TechCommentWithAuthor,
  };
}

export async function deleteTechCommentAction(input: {
  commentId: string;
  slug?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("tech_comments")
    .update({
      is_deleted: true,
      deleted_by: user.id,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", input.commentId);

  if (error) {
    return { success: false, error: error.message };
  }

  if (input.slug) revalidatePath(`/tech-weekly/${input.slug}`);
  return { success: true };
}

export async function submitTechReportAction(input: {
  targetType: "submission" | "comment" | "post";
  targetId: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const trimmed = input.reason.trim();
  if (trimmed.length < 3 || trimmed.length > 1000) {
    return {
      success: false,
      error: "Please provide a brief reason (3 to 1000 characters).",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { success: false, error: "Please sign in to report content." };
  }

  const { error } = await supabase.from("tech_reports").insert({
    reporter_id: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: trimmed,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchTechWeeklyReviewQueueData(): Promise<{
  authorized: boolean;
  role: CsiRole;
  csiId: number | null;
  currentWeek: TechWeek | null;
  isWindowOpen: boolean;
  submissions: TechSubmissionWithAuthor[];
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return {
      authorized: false,
      role: "unverified",
      csiId: null,
      currentWeek: null,
      isWindowOpen: false,
      submissions: [],
    };
  }

  const [{ data: profile }, { data: currentWeek }, { data: settingsRow }, { data: subs }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, role, csi_id, is_admin, is_suspended")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.rpc("get_or_create_current_tech_week"),
      supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("tech_submissions")
        .select(
          `
          *,
          author:profiles!tech_submissions_author_id_fkey (${AUTHOR_BADGE_SELECT}),
          week:tech_weeks!tech_submissions_week_id_fkey (*)
        `
        )
        .eq("is_deleted", false)
        .neq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

  const role = (profile?.role as CsiRole) || "unverified";
  const csiId = profile?.csi_id ?? null;
  const authorized =
    !profile?.is_suspended &&
    (role === "tech_head" ||
      role === "super_admin" ||
      csiId === 241 ||
      csiId === 246 ||
      csiId === 303 ||
      Boolean(profile?.is_admin));

  if (!authorized) {
    return {
      authorized: false,
      role,
      csiId,
      currentWeek: null,
      isWindowOpen: false,
      submissions: [],
    };
  }

  const resolvedWeek = (currentWeek as TechWeek | null) ?? null;
  const settings =
    (settingsRow as PlatformSettings | null) || DEFAULT_SETTINGS;
  const isWindowOpen = computeIsWindowOpen(resolvedWeek, settings);

  return {
    authorized: true,
    role: profile?.is_admin && role === "unverified" ? "super_admin" : role,
    csiId,
    currentWeek: resolvedWeek,
    isWindowOpen,
    submissions: (subs || []) as unknown as TechSubmissionWithAuthor[],
  };
}

export async function fetchTechWeeklyWriteContext(
  submissionId?: string | null
): Promise<{
  authenticated: boolean;
  userId: string | null;
  role: CsiRole;
  csiId: number | null;
  dept: string | null;
  year: string | null;
  canWrite: boolean;
  currentWeek: TechWeek | null;
  isWindowOpen: boolean;
  settings: PlatformSettings;
  editingSubmission: TechSubmissionWithAuthor | null;
  myWeekSubmissions: TechSubmissionWithAuthor[];
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return {
      authenticated: false,
      userId: null,
      role: "unverified",
      csiId: null,
      dept: null,
      year: null,
      canWrite: false,
      currentWeek: null,
      isWindowOpen: false,
      settings: DEFAULT_SETTINGS,
      editingSubmission: null,
      myWeekSubmissions: [],
    };
  }

  const [
    { data: profile },
    { data: settingsRow },
    { data: currentWeek },
    { data: userSubs },
    specificSubRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, csi_id, dept, year, is_admin, is_suspended")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.rpc("get_or_create_current_tech_week"),
    supabase
      .from("tech_submissions")
      .select(
        `
        *,
        author:profiles!tech_submissions_author_id_fkey (${AUTHOR_BADGE_SELECT}),
        week:tech_weeks!tech_submissions_week_id_fkey (*)
      `
      )
      .eq("author_id", user.id)
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false })
      .limit(20),
    submissionId
      ? supabase
          .from("tech_submissions")
          .select(
            `
            *,
            author:profiles!tech_submissions_author_id_fkey (${AUTHOR_BADGE_SELECT}),
            week:tech_weeks!tech_submissions_week_id_fkey (*)
          `
          )
          .eq("id", submissionId)
          .eq("is_deleted", false)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const role =
    profile?.is_admin && (!profile?.role || profile.role === "unverified")
      ? ("super_admin" as CsiRole)
      : ((profile?.role as CsiRole) || "unverified");
  const csiId = profile?.csi_id ?? null;
  const canWrite =
    !profile?.is_suspended &&
    (role === "tech_member" ||
      role === "tech_head" ||
      role === "super_admin" ||
      Boolean(profile?.is_admin));

  const settings = (settingsRow as PlatformSettings | null) || DEFAULT_SETTINGS;
  const resolvedWeek = (currentWeek as TechWeek | null) ?? null;
  const isWindowOpen = computeIsWindowOpen(resolvedWeek, settings);

  const allMySubs = (userSubs || []) as unknown as TechSubmissionWithAuthor[];
  const myWeekSubmissions = resolvedWeek
    ? allMySubs.filter((s) => s.week_id === resolvedWeek.id)
    : allMySubs;

  let editingSubmission: TechSubmissionWithAuthor | null = null;
  const specificSub = specificSubRes?.data as unknown as TechSubmissionWithAuthor | null;
  if (specificSub && (specificSub.author_id === user.id || role === "super_admin")) {
    editingSubmission = specificSub;
  } else if (myWeekSubmissions.length > 0) {
    editingSubmission = myWeekSubmissions[0];
  }

  return {
    authenticated: true,
    userId: user.id,
    role,
    csiId,
    dept: profile?.dept ?? null,
    year: profile?.year ?? null,
    canWrite,
    currentWeek: resolvedWeek,
    isWindowOpen: isWindowOpen || role === "super_admin",
    settings,
    editingSubmission,
    myWeekSubmissions,
  };
}

