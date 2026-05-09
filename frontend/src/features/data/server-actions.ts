"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type PostWithAuthor } from "@/types/database";

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
