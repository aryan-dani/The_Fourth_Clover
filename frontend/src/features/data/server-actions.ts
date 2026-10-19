"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reviewDecisionSchema } from "@/lib/validations";
import { getCurrentWeekKey } from "@/lib/utils";
import type { PostWithAuthor, PublicationRole } from "@/types/database";

const POSTS_WITH_AUTHOR_SELECT = `
  *,
  author:profiles!posts_author_id_fkey (
    id,
    username,
    full_name,
    avatar_url
  ),
  likes(count),
  comments(count)
`;

export async function loadMoreExplorePostsAction(
  limit: number,
  offset: number,
) {
  const supabase = await createSupabaseServerClient();
  const end = offset + limit - 1;

  const { data, error } = await supabase
    .from("posts")
    .select(POSTS_WITH_AUTHOR_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, end);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as PostWithAuthor[];
}

export async function loadMoreJournalPostsAction(options: {
  limit: number;
  offset: number;
  sort?: "latest" | "popular";
  format?: "all" | "poetry" | "prose";
  tag?: string;
}) {
  const { fetchJournalPostsPage } = await import(
    "@/features/data/server-queries"
  );
  const { posts, error } = await fetchJournalPostsPage(options);
  if (error) {
    throw new Error(error);
  }
  return posts;
}

export async function loadMorePublicationPostsAction(
  publicationSlug: string,
  limit: number,
  offset: number,
): Promise<PostWithAuthor[]> {
  const supabase = await createSupabaseServerClient();
  const { data: pubData, error: pubError } = await supabase
    .from("publications")
    .select("id")
    .eq("slug", publicationSlug)
    .single();

  if (pubError || !pubData) {
    return [];
  }

  const end = offset + limit - 1;
  const { data, error } = await supabase
    .from("posts")
    .select(POSTS_WITH_AUTHOR_SELECT)
    .eq("publication_id", pubData.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, end);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as PostWithAuthor[];
}

export async function notifyEditorsOfReviewSubmissionAction(
  postId: string,
  postTitle: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { ok: false, error: "Not authenticated" };
    }

    const { data: post } = await supabase
      .from("posts")
      .select("id, title, author_id, publication_id, status")
      .eq("id", postId)
      .maybeSingle();

    if (!post || !post.publication_id) {
      return { ok: false, error: "Publication post not found" };
    }

    const [authorProfileRes, editorsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("publication_members")
        .select("user_id")
        .eq("publication_id", post.publication_id)
        .eq("role", "editor"),
    ]);

    const authorName =
      authorProfileRes.data?.full_name ||
      authorProfileRes.data?.username ||
      "A CSI writer";

    const editorIds = (editorsRes.data || [])
      .map((row: { user_id: string }) => row.user_id)
      .filter((editorId: string) => editorId !== user.id);

    if (editorIds.length > 0) {
      const notificationsPayload = editorIds.map((editorId: string) => ({
        user_id: editorId,
        type: "review_submitted" as const,
        message: `${authorName} submitted "${postTitle || post.title}" for CSI review`,
        post_id: post.id,
        from_user_id: user.id,
        read: false,
      }));

      await supabase.from("notifications").insert(notificationsPayload);
    }

    revalidatePath("/csi/review");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to notify editors",
    };
  }
}

async function verifyCallerIsPublicationEditor(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  publicationId: string,
  userId: string,
): Promise<boolean> {
  const [memberRes, profileRes] = await Promise.all([
    supabase
      .from("publication_members")
      .select("role")
      .eq("publication_id", publicationId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  return memberRes.data?.role === "editor" || Boolean(profileRes.data?.is_admin);
}

export async function approvePublicationPostAction(
  postId: string,
): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const parsed = reviewDecisionSchema.safeParse({ postId });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Invalid post ID",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { ok: false, error: "You must be signed in to review posts." };
    }

    const { data: post, error: postErr } = await supabase
      .from("posts")
      .select("id, title, slug, author_id, publication_id, status")
      .eq("id", parsed.data.postId)
      .single();

    if (postErr || !post || !post.publication_id) {
      return { ok: false, error: "Post not found in publication queue." };
    }

    const isEditor = await verifyCallerIsPublicationEditor(
      supabase,
      post.publication_id,
      user.id,
    );
    if (!isEditor) {
      return {
        ok: false,
        error: "Only CSI editors can approve and publish submissions.",
      };
    }

    const nowIso = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from("posts")
      .update({
        status: "published",
        published_at: nowIso,
        updated_at: nowIso,
        review_note: null,
      })
      .eq("id", post.id);

    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    if (post.author_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: post.author_id,
        type: "review_approved",
        message: `Your CSI post "${post.title}" was approved and published!`,
        post_id: post.id,
        from_user_id: user.id,
        read: false,
      });
    }

    revalidatePath("/csi");
    revalidatePath(`/csi/${post.slug}`);
    revalidatePath("/csi/review");
    revalidatePath("/dashboard");

    return { ok: true, slug: post.slug };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to approve post",
    };
  }
}

export async function requestPublicationChangesAction(
  postId: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = reviewDecisionSchema.safeParse({ postId, note });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Invalid review input",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { ok: false, error: "You must be signed in to review posts." };
    }

    const { data: post, error: postErr } = await supabase
      .from("posts")
      .select("id, title, slug, author_id, publication_id, status")
      .eq("id", parsed.data.postId)
      .single();

    if (postErr || !post || !post.publication_id) {
      return { ok: false, error: "Post not found in publication queue." };
    }

    const isEditor = await verifyCallerIsPublicationEditor(
      supabase,
      post.publication_id,
      user.id,
    );
    if (!isEditor) {
      return {
        ok: false,
        error: "Only CSI editors can request changes on submissions.",
      };
    }

    const cleanNote = parsed.data.note?.trim() || null;
    const nowIso = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from("posts")
      .update({
        status: "draft",
        published_at: null,
        review_note: cleanNote,
        updated_at: nowIso,
      })
      .eq("id", post.id);

    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    if (post.author_id !== user.id) {
      const notifMsg = cleanNote
        ? `Changes requested on "${post.title}": ${cleanNote}`
        : `An editor requested changes on your CSI post "${post.title}".`;

      await supabase.from("notifications").insert({
        user_id: post.author_id,
        type: "changes_requested",
        message: notifMsg,
        post_id: post.id,
        from_user_id: user.id,
        read: false,
      });
    }

    revalidatePath("/csi/review");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to request changes",
    };
  }
}

export async function upsertPublicationMemberAction(
  publicationSlug: string,
  userIdentifier: string,
  role: PublicationRole,
): Promise<{ ok: boolean; error?: string }> {
  const cleanIdent = userIdentifier.trim().replace(/^@/, "");
  if (!cleanIdent || (role !== "writer" && role !== "editor")) {
    return { ok: false, error: "Invalid member username or role." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { ok: false, error: "Not authenticated" };
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!callerProfile?.is_admin) {
      return { ok: false, error: "Only administrators can manage members." };
    }

    const { data: pub } = await supabase
      .from("publications")
      .select("id")
      .eq("slug", publicationSlug)
      .single();

    if (!pub) {
      return { ok: false, error: "Publication not found." };
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let targetUserId = cleanIdent;

    if (!uuidRegex.test(cleanIdent)) {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", cleanIdent)
        .maybeSingle();

      if (!targetProfile?.id) {
        return {
          ok: false,
          error: `No user found with username "@${cleanIdent}".`,
        };
      }
      targetUserId = targetProfile.id;
    }

    const { error } = await supabase.from("publication_members").upsert(
      {
        publication_id: pub.id,
        user_id: targetUserId,
        role,
      },
      { onConflict: "publication_id,user_id" },
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/csi");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update member",
    };
  }
}

export async function removePublicationMemberAction(
  publicationSlug: string,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { ok: false, error: "Not authenticated" };
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!callerProfile?.is_admin) {
      return { ok: false, error: "Only administrators can manage members." };
    }

    const { data: pub } = await supabase
      .from("publications")
      .select("id")
      .eq("slug", publicationSlug)
      .single();

    if (!pub) {
      return { ok: false, error: "Publication not found." };
    }

    const { error } = await supabase
      .from("publication_members")
      .delete()
      .eq("publication_id", pub.id)
      .eq("user_id", userId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/csi");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to remove member",
    };
  }
}

export async function joinPublicationAsWriterAction(
  publicationSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return {
        ok: false,
        error: "Please sign in first to join as a CSI Technical Member.",
      };
    }

    const { data: pub } = await supabase
      .from("publications")
      .select("id")
      .eq("slug", publicationSlug)
      .maybeSingle();

    if (!pub) {
      return { ok: false, error: "Publication not found." };
    }

    const { data: existing } = await supabase
      .from("publication_members")
      .select("role")
      .eq("publication_id", pub.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.role) {
      return { ok: true };
    }

    const { error } = await supabase.from("publication_members").insert({
      publication_id: pub.id,
      user_id: user.id,
      role: "writer",
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/csi");
    revalidatePath("/csi/write");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not join publication",
    };
  }
}

export async function selectWeeklyLinkedinPickAction(
  postId: string,
  requestedWeekKey?: string,
): Promise<{
  ok: boolean;
  weekKey?: string;
  slug?: string;
  error?: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { ok: false, error: "Please sign in first." };
    }

    const { data: post, error: postErr } = await supabase
      .from("posts")
      .select(
        "id, title, slug, author_id, publication_id, status, published_at, linkedin_pick_week",
      )
      .eq("id", postId)
      .maybeSingle();

    if (postErr || !post || !post.publication_id) {
      return { ok: false, error: "Publication post not found." };
    }

    const [memberRes, profileRes] = await Promise.all([
      supabase
        .from("publication_members")
        .select("role")
        .eq("publication_id", post.publication_id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    const isSuperAdmin = Boolean(profileRes.data?.is_admin);
    const isEditor = memberRes.data?.role === "editor" || isSuperAdmin;

    if (!isEditor) {
      return {
        ok: false,
        error:
          "Only CSI Technical Heads (Darshan & Tanish) or the Super Admin can select the Weekly LinkedIn Pick.",
      };
    }

    const weekKey = requestedWeekKey?.trim() || getCurrentWeekKey();

    // Check if another post is already chosen for this week
    const { data: existingPick } = await supabase
      .from("posts")
      .select("id, title")
      .eq("publication_id", post.publication_id)
      .eq("linkedin_pick_week", weekKey)
      .neq("id", post.id)
      .maybeSingle();

    if (existingPick) {
      if (!isSuperAdmin) {
        return {
          ok: false,
          error: `"${existingPick.title}" is already locked in as the official CSI LinkedIn post for ${weekKey}. Technical Heads can select only one post per week.`,
        };
      }

      // Super Admin can override/swap the weekly pick
      await supabase
        .from("posts")
        .update({
          linkedin_pick_week: null,
          linkedin_picked_by: null,
        })
        .eq("id", existingPick.id);
    }

    const nowIso = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from("posts")
      .update({
        status: "published",
        published_at: post.published_at ?? nowIso,
        review_note: null,
        linkedin_pick_week: weekKey,
        linkedin_picked_by: user.id,
        updated_at: nowIso,
      })
      .eq("id", post.id);

    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    if (post.author_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: post.author_id,
        type: "review_approved",
        message: `Your CSI post "${post.title}" was selected as the official CSI MIT-WPU LinkedIn Post for ${weekKey} and is now live!`,
        post_id: post.id,
        from_user_id: user.id,
        read: false,
      });
    }

    revalidatePath("/csi");
    revalidatePath(`/csi/${post.slug}`);
    revalidatePath("/csi/review");
    revalidatePath("/dashboard");

    return { ok: true, weekKey, slug: post.slug };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Failed to select Weekly LinkedIn Pick",
    };
  }
}

export async function clearWeeklyLinkedinPickAction(
  postId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { ok: false, error: "Not authenticated" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return {
        ok: false,
        error: "Only the Super Admin can clear a locked Weekly LinkedIn Pick.",
      };
    }

    const { error } = await supabase
      .from("posts")
      .update({
        linkedin_pick_week: null,
        linkedin_picked_by: null,
      })
      .eq("id", postId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/csi");
    revalidatePath("/csi/review");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to clear weekly pick",
    };
  }
}

export async function superAdminDeletePostAction(
  postId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { ok: false, error: "Not authenticated" };
    }

    const [{ data: profile }, { data: post }] = await Promise.all([
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("posts")
        .select("id, author_id")
        .eq("id", postId)
        .maybeSingle(),
    ]);

    if (!post) {
      return { ok: false, error: "Post not found." };
    }

    if (!profile?.is_admin && post.author_id !== user.id) {
      return {
        ok: false,
        error: "Only the author or Super Admin can delete this post.",
      };
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/explore");
    revalidatePath("/csi");
    revalidatePath("/csi/review");
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to delete post",
    };
  }
}

