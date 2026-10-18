import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PostWithAuthor,
  Post,
  Profile,
  Publication,
  PublicationMemberWithProfile,
  PublicationRole,
} from "@/types/database";

export const POSTS_WITH_AUTHOR_SELECT = `
  *,
  author:profiles!posts_author_id_fkey (
    id,
    username,
    full_name,
    avatar_url,
    bio
  ),
  likes(count),
  comments(count),
  publication:publications (
    id,
    slug,
    name
  )
`;

const LEGACY_POSTS_WITH_AUTHOR_SELECT = `
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

const FALLBACK_CSI_PUBLICATION: Publication = {
  id: "00000000-0000-0000-0000-000000000c51",
  slug: "csi",
  name: "CSI Tech Blog",
  description:
    "Technical deep-dives, tutorials, and engineering explainers written by CSI MIT-WPU technical members.",
  cover_image: null,
  created_at: new Date(0).toISOString(),
};

function normalizeTags(rows: { tags: string[] | null }[] | null): string[] {
  if (!rows?.length) return [];
  const allTags = rows
    .flatMap((post) => post.tags || [])
    .filter((tag, index, array) => array.indexOf(tag) === index)
    .sort();
  return allTags;
}

export async function getPublicationBySlug(
  slug: string,
): Promise<Publication | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("publications")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      if (slug === "csi") return FALLBACK_CSI_PUBLICATION;
      return null;
    }

    return data as Publication;
  } catch {
    if (slug === "csi") return FALLBACK_CSI_PUBLICATION;
    return null;
  }
}

export async function listPublicationPosts(
  publicationSlug: string,
  limit = 20,
  offset = 0,
): Promise<{
  publication: Publication | null;
  posts: PostWithAuthor[];
  tags: string[];
  error: string | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: pubData, error: pubError } = await supabase
      .from("publications")
      .select("*")
      .eq("slug", publicationSlug)
      .maybeSingle();

    if (pubError || !pubData) {
      return {
        publication:
          publicationSlug === "csi" ? FALLBACK_CSI_PUBLICATION : null,
        posts: [],
        tags: [],
        error: null,
      };
    }

    const publication = pubData as Publication;
    const end = offset + limit - 1;

    const [postsRes, tagRowsRes] = await Promise.all([
      supabase
        .from("posts")
        .select(POSTS_WITH_AUTHOR_SELECT)
        .eq("publication_id", publication.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(offset, end),
      supabase
        .from("posts")
        .select("tags")
        .eq("publication_id", publication.id)
        .eq("status", "published")
        .not("tags", "is", null),
    ]);

    if (postsRes.error) {
      return {
        publication,
        posts: [],
        tags: [],
        error: postsRes.error.message,
      };
    }

    const posts = (postsRes.data || []) as PostWithAuthor[];
    const tags = normalizeTags(
      (tagRowsRes.data as { tags: string[] | null }[] | null) ?? null,
    );

    return { publication, posts, tags, error: null };
  } catch (e) {
    return {
      publication:
        publicationSlug === "csi" ? FALLBACK_CSI_PUBLICATION : null,
      posts: [],
      tags: [],
      error:
        e instanceof Error ? e.message : "Failed to load publication posts",
    };
  }
}

export async function fetchPublicationPostBySlug(
  publicationSlug: string,
  postSlug: string,
): Promise<PostWithAuthor | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: pubData } = await supabase
      .from("publications")
      .select("id, slug, name")
      .eq("slug", publicationSlug)
      .maybeSingle();

    if (!pubData) return null;

    const { data, error } = await supabase
      .from("posts")
      .select(POSTS_WITH_AUTHOR_SELECT)
      .eq("publication_id", pubData.id)
      .eq("slug", postSlug)
      .maybeSingle();

    if (error || !data) return null;
    return data as PostWithAuthor;
  } catch {
    return null;
  }
}

export async function getPublicationMembers(
  publicationSlug: string,
): Promise<PublicationMemberWithProfile[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: pubData } = await supabase
      .from("publications")
      .select("id")
      .eq("slug", publicationSlug)
      .maybeSingle();

    if (!pubData) return [];

    const { data, error } = await supabase
      .from("publication_members")
      .select(
        `
        publication_id,
        user_id,
        role,
        created_at,
        profile:profiles!publication_members_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          bio
        )
      `,
      )
      .eq("publication_id", pubData.id)
      .order("role", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return (data as unknown as PublicationMemberWithProfile[]).filter(
      (m) => Boolean(m.profile),
    );
  } catch {
    return [];
  }
}

export async function getUserPublicationRole(
  publicationSlug: string,
  userId: string,
): Promise<{
  role: PublicationRole | null;
  publicationId: string | null;
  publicationName: string | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const [pubRes, profileRes] = await Promise.all([
      supabase
        .from("publications")
        .select("id, name")
        .eq("slug", publicationSlug)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const pub = pubRes.data;
    if (!pub) {
      return { role: null, publicationId: null, publicationName: null };
    }

    const { data: memberRow } = await supabase
      .from("publication_members")
      .select("role")
      .eq("publication_id", pub.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberRow?.role === "editor" || memberRow?.role === "writer") {
      return {
        role: memberRow.role,
        publicationId: pub.id,
        publicationName: pub.name,
      };
    }

    if (profileRes.data?.is_admin) {
      return {
        role: "editor",
        publicationId: pub.id,
        publicationName: pub.name,
      };
    }

    return {
      role: null,
      publicationId: pub.id,
      publicationName: pub.name,
    };
  } catch {
    return { role: null, publicationId: null, publicationName: null };
  }
}

export async function listReviewQueue(
  publicationSlug: string,
): Promise<{
  authorized: boolean;
  posts: PostWithAuthor[];
  publication: Publication | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { authorized: false, posts: [], publication: null };
    }

    const { data: pubData } = await supabase
      .from("publications")
      .select("*")
      .eq("slug", publicationSlug)
      .maybeSingle();

    if (!pubData) {
      return {
        authorized: false,
        posts: [],
        publication:
          publicationSlug === "csi" ? FALLBACK_CSI_PUBLICATION : null,
      };
    }

    const roleInfo = await getUserPublicationRole(publicationSlug, user.id);
    if (roleInfo.role !== "editor") {
      return {
        authorized: false,
        posts: [],
        publication: pubData as Publication,
      };
    }

    const { data: postsData, error } = await supabase
      .from("posts")
      .select(POSTS_WITH_AUTHOR_SELECT)
      .eq("publication_id", pubData.id)
      .eq("status", "in_review")
      .order("updated_at", { ascending: false });

    if (error) {
      return {
        authorized: true,
        posts: [],
        publication: pubData as Publication,
      };
    }

    return {
      authorized: true,
      posts: (postsData || []) as PostWithAuthor[],
      publication: pubData as Publication,
    };
  } catch {
    return { authorized: false, posts: [], publication: null };
  }
}

export async function listRelatedPublicationPosts(
  publicationSlug: string,
  excludePostId: string,
  limit = 3,
): Promise<PostWithAuthor[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: pubData } = await supabase
      .from("publications")
      .select("id")
      .eq("slug", publicationSlug)
      .maybeSingle();

    if (!pubData) return [];

    const { data } = await supabase
      .from("posts")
      .select(POSTS_WITH_AUTHOR_SELECT)
      .eq("publication_id", pubData.id)
      .eq("status", "published")
      .neq("id", excludePostId)
      .order("published_at", { ascending: false })
      .limit(limit);

    return (data || []) as PostWithAuthor[];
  } catch {
    return [];
  }
}

export async function fetchExploreInitialData(
  limit = 20,
  offset = 0,
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
        .select(LEGACY_POSTS_WITH_AUTHOR_SELECT)
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
  slug: string,
): Promise<PostWithAuthor | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(LEGACY_POSTS_WITH_AUTHOR_SELECT)
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
  publication?: { id: string; slug: string; name: string } | null;
};

export type DashboardStatsSnapshot = {
  totalPosts: number;
  publishedPosts: number;
  inReviewPosts?: number;
  totalLikes: number;
  totalComments: number;
};

const emptyDashboardStats: DashboardStatsSnapshot = {
  totalPosts: 0,
  publishedPosts: 0,
  inReviewPosts: 0,
  totalLikes: 0,
  totalComments: 0,
};

export async function fetchDashboardInitialData(): Promise<{
  userId: string | null;
  posts: DashboardPostRow[];
  stats: DashboardStatsSnapshot;
  csiRole: PublicationRole | null;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return {
      userId: null,
      posts: [],
      stats: emptyDashboardStats,
      csiRole: null,
    };
  }

  const [postsQuery, csiRoleInfo] = await Promise.all([
    supabase
      .from("posts")
      .select(
        `
          *,
          likes (count),
          comments (count),
          publication:publications (id, slug, name)
        `,
      )
      .eq("author_id", user.id)
      .order("created_at", { ascending: false }),
    getUserPublicationRole("csi", user.id),
  ]);

  let userPosts: DashboardPostRow[] = [];
  if (!postsQuery.error && postsQuery.data) {
    userPosts = postsQuery.data as DashboardPostRow[];
  } else {
    const fallbackRes = await supabase
      .from("posts")
      .select(
        `
          *,
          likes (count),
          comments (count)
        `,
      )
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    userPosts = (fallbackRes.data || []) as DashboardPostRow[];
  }

  const totalPosts = userPosts.length;
  const publishedPosts = userPosts.filter(
    (p) => p.status === "published",
  ).length;
  const inReviewPosts = userPosts.filter(
    (p) => p.status === "in_review",
  ).length;

  const totalLikes = userPosts.reduce(
    (sum, post) => sum + (post.likes?.[0]?.count || 0),
    0,
  );

  const totalComments = userPosts.reduce(
    (sum, post) => sum + (post.comments?.[0]?.count || 0),
    0,
  );

  return {
    userId: user.id,
    posts: userPosts,
    stats: {
      totalPosts,
      publishedPosts,
      inReviewPosts,
      totalLikes,
      totalComments,
    },
    csiRole: csiRoleInfo.role,
  };
}

const SITEMAP_POST_CAP = 5000;
const SITEMAP_PROFILE_CAP = 5000;
const RSS_POST_LIMIT = 50;

export async function listPublishedPostSlugsForSitemap(): Promise<
  {
    slug: string;
    updated_at: string | null;
    published_at: string | null;
    publication_slug?: string | null;
  }[]
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, updated_at, published_at, publication:publications(slug)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(SITEMAP_POST_CAP);

  if (error || !data) {
    const { data: fallback } = await supabase
      .from("posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(SITEMAP_POST_CAP);
    return (fallback || []) as {
      slug: string;
      updated_at: string | null;
      published_at: string | null;
    }[];
  }

  return (
    data as unknown as {
      slug: string;
      updated_at: string | null;
      published_at: string | null;
      publication?: { slug: string } | { slug: string }[] | null;
    }[]
  ).map((row) => {
    const pub = Array.isArray(row.publication)
      ? row.publication[0]
      : row.publication;
    return {
      slug: row.slug,
      updated_at: row.updated_at,
      published_at: row.published_at,
      publication_slug: pub?.slug ?? null,
    };
  });
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
  limit = RSS_POST_LIMIT,
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

export async function listRecentPublicationPostsForRss(
  publicationSlug: string,
  limit = RSS_POST_LIMIT,
): Promise<RssPostRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: pub } = await supabase
      .from("publications")
      .select("id")
      .eq("slug", publicationSlug)
      .maybeSingle();

    if (!pub) return [];

    const { data } = await supabase
      .from("posts")
      .select("title, slug, excerpt, published_at, updated_at")
      .eq("publication_id", pub.id)
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(limit);

    return (data || []) as RssPostRow[];
  } catch {
    return [];
  }
}

export async function fetchFollowingFeedInitial(
  userId: string,
  limit = 20,
  offset = 0,
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
      .select(LEGACY_POSTS_WITH_AUTHOR_SELECT)
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
  userId: string,
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
  profileUserId: string,
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
