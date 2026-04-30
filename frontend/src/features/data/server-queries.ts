import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PostWithAuthor, Post, Profile } from "@/types/database";

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

function normalizeTags(
  rows: { tags: string[] | null }[] | null
): string[] {
  if (!rows?.length) return [];
  const allTags = rows
    .flatMap((post) => post.tags || [])
    .filter((tag, index, array) => array.indexOf(tag) === index)
    .sort();
  return allTags;
}

export async function fetchExploreInitialData(
  limit = 20,
  offset = 0
): Promise<{
  posts: PostWithAuthor[];
  tags: string[];
  error: string | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const end = offset + limit - 1;
    const [postsRes, tagRowsRes] = await Promise.all([
      supabase
        .from("posts")
        .select(POSTS_WITH_AUTHOR_SELECT)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(offset, end),
      supabase
        .from("posts")
        .select("tags")
        .eq("status", "published")
        .not("tags", "is", null),
    ]);

    if (postsRes.error) {
      return {
        posts: [],
        tags: [],
        error: postsRes.error.message,
      };
    }

    const posts = (postsRes.data || []) as PostWithAuthor[];
    const tags = normalizeTags(tagRowsRes.data);

    return { posts, tags, error: null };
  } catch (e) {
    return {
      posts: [],
      tags: [],
      error: e instanceof Error ? e.message : "Failed to load explore data",
    };
  }
}

export async function fetchPostBySlugForPage(
  slug: string
): Promise<PostWithAuthor | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POSTS_WITH_AUTHOR_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;
  return data as PostWithAuthor;
}

type PostWithCounts = Post & {
  likes: { count: number }[];
  comments: { count: number }[];
};

export async function fetchPublicProfilePageData(username: string): Promise<{
  profile: Profile | null;
  posts: PostWithCounts[];
}> {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    return { profile: null, posts: [] };
  }

  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select("*, likes(count), comments(count)")
    .eq("author_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (postsError) {
    return { profile: profile as Profile, posts: [] };
  }

  return {
    profile: profile as Profile,
    posts: (postsData || []) as PostWithCounts[],
  };
}

export type DashboardPostRow = Post & {
  likes: { count: number }[];
  comments: { count: number }[];
};

export type DashboardStatsSnapshot = {
  totalPosts: number;
  publishedPosts: number;
  totalLikes: number;
  totalComments: number;
};

const emptyDashboardStats: DashboardStatsSnapshot = {
  totalPosts: 0,
  publishedPosts: 0,
  totalLikes: 0,
  totalComments: 0,
};

export async function fetchDashboardInitialData(): Promise<{
  userId: string | null;
  posts: DashboardPostRow[];
  stats: DashboardStatsSnapshot;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { userId: null, posts: [], stats: emptyDashboardStats };
  }

  const { data, error } = await supabase
    .from("posts")
    .select(
      `
          *,
          likes (count),
          comments (count)
        `
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { userId: user.id, posts: [], stats: emptyDashboardStats };
  }

  const userPosts = (data || []) as DashboardPostRow[];
  const totalLikes = userPosts.reduce(
    (sum, post) => sum + (post.likes?.[0]?.count || 0),
    0
  );
  const totalComments = userPosts.reduce(
    (sum, post) => sum + (post.comments?.[0]?.count || 0),
    0
  );
  const publishedPosts = userPosts.filter(
    (p) => p.status === "published"
  ).length;

  return {
    userId: user.id,
    posts: userPosts,
    stats: {
      totalPosts: userPosts.length,
      publishedPosts,
      totalLikes,
      totalComments,
    },
  };
}

const SITEMAP_POST_CAP = 5000;
const SITEMAP_PROFILE_CAP = 5000;
const RSS_POST_LIMIT = 50;

export async function listPublishedPostSlugsForSitemap(): Promise<
  { slug: string; updated_at: string | null; published_at: string | null }[]
> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(SITEMAP_POST_CAP);
  return (data || []) as {
    slug: string;
    updated_at: string | null;
    published_at: string | null;
  }[];
}

export async function listProfileUsernamesForSitemap(): Promise<
  { username: string; updated_at: string }[]
> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .order("updated_at", { ascending: false })
    .limit(SITEMAP_PROFILE_CAP);
  return (data || []) as { username: string; updated_at: string }[];
}

export type RssPostRow = Pick<
  Post,
  "title" | "slug" | "excerpt" | "published_at" | "updated_at"
>;

export async function listRecentPublishedPostsForRss(
  limit = RSS_POST_LIMIT
): Promise<RssPostRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select("title, slug, excerpt, published_at, updated_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data || []) as RssPostRow[];
}

export async function fetchFollowingFeedInitial(
  userId: string,
  limit = 20,
  offset = 0
): Promise<{ posts: PostWithAuthor[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: followsRows, error: followErr } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    if (followErr) {
      return { posts: [], error: followErr.message };
    }

    const authorIds = (followsRows || []).map((r) => r.following_id);
    if (authorIds.length === 0) {
      return { posts: [], error: null };
    }

    const end = offset + limit - 1;
    const { data, error } = await supabase
      .from("posts")
      .select(POSTS_WITH_AUTHOR_SELECT)
      .in("author_id", authorIds)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(offset, end);

    if (error) {
      return { posts: [], error: error.message };
    }

    return { posts: (data || []) as PostWithAuthor[], error: null };
  } catch (e) {
    return {
      posts: [],
      error: e instanceof Error ? e.message : "Failed to load following feed",
    };
  }
}

export async function countAccountsFollowedByUser(
  userId: string
): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);
  return count ?? 0;
}

export async function getProfileFollowMeta(
  viewerId: string | null,
  profileUserId: string
): Promise<{
  isFollowing: boolean;
  followerCount: number;
}> {
  const supabase = await createSupabaseServerClient();

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profileUserId);

  let isFollowing = false;
  if (viewerId && viewerId !== profileUserId) {
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewerId)
      .eq("following_id", profileUserId)
      .maybeSingle();
    isFollowing = !!data;
  }

  return {
    isFollowing,
    followerCount: followerCount ?? 0,
  };
}
