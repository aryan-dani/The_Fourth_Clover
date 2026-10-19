"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Bookmark } from "@/types/database";

export type BookmarkTargetType = "post" | "tech_submission";

export type BookmarkListItem = {
  id: string;
  targetType: BookmarkTargetType;
  targetId: string;
  createdAt: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  section: "journal" | "tech";
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function isBookmarkedAction(
  targetType: BookmarkTargetType,
  targetId: string,
): Promise<boolean> {
  if (!isUuid(targetId)) return false;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return false;

  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  return Boolean(data?.id);
}

export async function toggleBookmark(input: {
  targetType: BookmarkTargetType;
  targetId: string;
}): Promise<{ success: boolean; bookmarked?: boolean; error?: string }> {
  const { targetType, targetId } = input;
  if (
    (targetType !== "post" && targetType !== "tech_submission") ||
    !isUuid(targetId)
  ) {
    return { success: false, error: "Invalid bookmark target." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { success: false, error: "Sign in to save to your reading list." };
  }

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/reading-list");
    return { success: true, bookmarked: false };
  }

  const { error } = await supabase.from("bookmarks").insert({
    user_id: user.id,
    target_type: targetType,
    target_id: targetId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/reading-list");
  return { success: true, bookmarked: true };
}

export async function listBookmarks(): Promise<{
  items: BookmarkListItem[];
  error?: string;
  authenticated: boolean;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { items: [], authenticated: false };
  }

  const { data: rows, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { items: [], authenticated: true, error: error.message };
  }

  const bookmarks = (rows || []) as Bookmark[];
  const postIds = bookmarks
    .filter((b) => b.target_type === "post")
    .map((b) => b.target_id);
  const techIds = bookmarks
    .filter((b) => b.target_type === "tech_submission")
    .map((b) => b.target_id);

  const [postsRes, techRes] = await Promise.all([
    postIds.length
      ? supabase
          .from("posts")
          .select("id, title, slug, excerpt, cover_image, featured_image")
          .in("id", postIds)
      : Promise.resolve({ data: [] as const }),
    techIds.length
      ? supabase
          .from("tech_submissions")
          .select("id, title, slug, summary, cover_image")
          .in("id", techIds)
          .eq("is_deleted", false)
      : Promise.resolve({ data: [] as const }),
  ]);

  type PostRow = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    featured_image?: string | null;
  };
  type TechRow = {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    cover_image: string | null;
  };

  const postMap = new Map(
    ((postsRes.data || []) as PostRow[]).map((p) => [p.id, p]),
  );
  const techMap = new Map(
    ((techRes.data || []) as TechRow[]).map((t) => [t.id, t]),
  );

  const items: BookmarkListItem[] = [];
  for (const b of bookmarks) {
    if (b.target_type === "post") {
      const post = postMap.get(b.target_id);
      if (!post) continue;
      items.push({
        id: b.id,
        targetType: "post",
        targetId: b.target_id,
        createdAt: b.created_at,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImage: post.cover_image || post.featured_image || null,
        section: "journal",
      });
    } else {
      const tech = techMap.get(b.target_id);
      if (!tech) continue;
      items.push({
        id: b.id,
        targetType: "tech_submission",
        targetId: b.target_id,
        createdAt: b.created_at,
        title: tech.title,
        slug: tech.slug,
        excerpt: tech.summary,
        coverImage: tech.cover_image,
        section: "tech",
      });
    }
  }

  return { items, authenticated: true };
}
