"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reviewDecisionSchema, publicationMemberSchema } from "@/lib/validations";
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
  userId: string,
  role: PublicationRole,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = publicationMemberSchema.safeParse({
    publicationSlug,
    userId,
    role,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Invalid member input",
    };
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
      .eq("slug", parsed.data.publicationSlug)
      .single();

    if (!pub) {
      return { ok: false, error: "Publication not found." };
    }

    const { error } = await supabase.from("publication_members").upsert(
      {
        publication_id: pub.id,
        user_id: parsed.data.userId,
        role: parsed.data.role,
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
