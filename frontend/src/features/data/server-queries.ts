import { cache } from "react";
import {
  createSupabaseServerClient,
  createSupabasePublicServerClient,
} from "@/lib/supabase/server";
import { getCurrentWeekKey } from "@/lib/utils";
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

export const LEGACY_POSTS_WITH_AUTHOR_SELECT = `
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
  id: "38a1f07f-4ed3-4465-b8fa-9899d69e6ea3",
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

export const getPublicationBySlug = cache(
  async (slug: string): Promise<Publication | null> => {
    try {
      const supabase = createSupabasePublicServerClient();
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
  },
);

export const listPublicationPosts = cache(
  async (
    publicationSlug: string,
    limit = 20,
    offset = 0,
  ): Promise<{
    publication: Publication | null;
    posts: PostWithAuthor[];
    submissions: PostWithAuthor[];
    weeklyPick: PostWithAuthor | null;
    tags: string[];
    error: string | null;
  }> => {
    try {
      const publication = await getPublicationBySlug(publicationSlug);
      if (!publication) {
        return {
          publication: null,
          posts: [],
          submissions: [],
          weeklyPick: null,
          tags: [],
          error: null,
        };
      }

      const supabase = createSupabasePublicServerClient();
      const end = offset + limit - 1;

      const [publishedRes, submissionsRes] = await Promise.all([
        supabase
          .from("posts")
          .select(POSTS_WITH_AUTHOR_SELECT)
          .eq("publication_id", publication.id)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .range(offset, end),
        supabase
          .from("posts")
          .select(POSTS_WITH_AUTHOR_SELECT)
          .eq("publication_id", publication.id)
          .eq("status", "in_review")
          .order("updated_at", { ascending: false })
          .limit(30),
      ]);

      if (publishedRes.error) {
        return {
          publication,
          posts: [],
          submissions: [],
          weeklyPick: null,
          tags: [],
          error: publishedRes.error.message,
        };
      }

      const posts = (publishedRes.data || []) as PostWithAuthor[];
      const submissions = (submissionsRes.data || []) as PostWithAuthor[];
      const combined = [...posts, ...submissions];
      const tags = normalizeTags(combined);

      const currentWeek = getCurrentWeekKey();
      const weeklyPick =
        combined.find((p) => p.linkedin_pick_week === currentWeek) ||
        combined.find((p) => Boolean(p.linkedin_pick_week)) ||
        null;

      return {
        publication,
        posts,
        submissions,
        weeklyPick,
        tags,
        error: null,
      };
    } catch (e) {
      return {
        publication:
          publicationSlug === "csi" ? FALLBACK_CSI_PUBLICATION : null,
        posts: [],
        submissions: [],
        weeklyPick: null,
        tags: [],
        error:
          e instanceof Error ? e.message : "Failed to load publication posts",
      };
    }
  },
);

export const fetchPublicationPostBySlug = cache(
  async (
    publicationSlug: string,
    postSlug: string,
  ): Promise<PostWithAuthor | null> => {
    try {
      const publication = await getPublicationBySlug(publicationSlug);
      if (!publication) return null;

      const publicSupabase = createSupabasePublicServerClient();
      const { data } = await publicSupabase
        .from("posts")
        .select(POSTS_WITH_AUTHOR_SELECT)
        .eq("publication_id", publication.id)
        .eq("slug", postSlug)
        .maybeSingle();

      if (data) {
        return data as PostWithAuthor;
      }

      // Fallback to authenticated server client for private drafts
      const authSupabase = await createSupabaseServerClient();
      const { data: draftData } = await authSupabase
        .from("posts")
        .select(POSTS_WITH_AUTHOR_SELECT)
        .eq("publication_id", publication.id)
        .eq("slug", postSlug)
        .maybeSingle();

      return (draftData as PostWithAuthor | null) ?? null;
    } catch {
      return null;
    }
  },
);

export const getPublicationMembers = cache(
  async (publicationSlug: string): Promise<PublicationMemberWithProfile[]> => {
    try {
      const publication = await getPublicationBySlug(publicationSlug);
      if (!publication) return [];

      const supabase = createSupabasePublicServerClient();
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
        .eq("publication_id", publication.id)
        .order("role", { ascending: true })
        .order("created_at", { ascending: true });

      if (error || !data) return [];

      return (data as unknown as PublicationMemberWithProfile[]).filter((m) =>
        Boolean(m.profile),
      );
    } catch {
      return [];
    }
  },
);

export async function getUserPublicationRole(
  publicationSlug: string,
  userId: string,
): Promise<{
  role: PublicationRole | null;
  isSuperAdmin: boolean;
  publicationId: string | null;
  publicationName: string | null;
}> {
  try {
    const pub = await getPublicationBySlug(publicationSlug);
    if (!pub) {
      return {
        role: null,
        isSuperAdmin: false,
        publicationId: null,
        publicationName: null,
      };
    }

    const supabase = createSupabasePublicServerClient();
    const [memberRes, profileRes] = await Promise.all([
      supabase
        .from("publication_members")
        .select("role")
        .eq("publication_id", pub.id)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const isSuperAdmin = Boolean(profileRes.data?.is_admin);
    const memberRole = memberRes.data?.role;

    if (isSuperAdmin || memberRole === "editor") {
      return {
        role: "editor",
        isSuperAdmin,
        publicationId: pub.id,
        publicationName: pub.name,
      };
    }

    if (memberRole === "writer") {
      return {
        role: "writer",
        isSuperAdmin: false,
        publicationId: pub.id,
        publicationName: pub.name,
      };
    }

    return {
      role: null,
      isSuperAdmin: false,
      publicationId: pub.id,
      publicationName: pub.name,
    };
  } catch {
    return {
      role: null,
      isSuperAdmin: false,
      publicationId: null,
      publicationName: null,
    };
  }
}

export async function listReviewQueue(
  publicationSlug: string,
): Promise<{
  authorized: boolean;
  isSuperAdmin: boolean;
  posts: PostWithAuthor[];
  publishedPosts: PostWithAuthor[];
  publication: Publication | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return {
        authorized: false,
        isSuperAdmin: false,
        posts: [],
        publishedPosts: [],
        publication: null,
      };
    }

    const [publication, roleInfo] = await Promise.all([
      getPublicationBySlug(publicationSlug),
      getUserPublicationRole(publicationSlug, user.id),
    ]);

    if (!publication || roleInfo.role !== "editor") {
      return {
        authorized: false,
        isSuperAdmin: roleInfo.isSuperAdmin,
        posts: [],
        publishedPosts: [],
        publication,
      };
    }

    const [inReviewRes, publishedRes] = await Promise.all([
      supabase
        .from("posts")
        .select(POSTS_WITH_AUTHOR_SELECT)
        .eq("publication_id", publication.id)
        .eq("status", "in_review")
        .order("updated_at", { ascending: false }),
      supabase
        .from("posts")
        .select(POSTS_WITH_AUTHOR_SELECT)
        .eq("publication_id", publication.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(20),
    ]);

    return {
      authorized: true,
      isSuperAdmin: roleInfo.isSuperAdmin,
      posts: (inReviewRes.data || []) as PostWithAuthor[],
      publishedPosts: (publishedRes.data || []) as PostWithAuthor[],
      publication,
    };
  } catch {
    return {
      authorized: false,
      isSuperAdmin: false,
      posts: [],
      publishedPosts: [],
      publication: null,
    };
  }
}

export const listRelatedPublicationPosts = cache(
  async (
    publicationSlug: string,
    excludePostId: string,
    limit = 3,
  ): Promise<PostWithAuthor[]> => {
    try {
      const pubData = await getPublicationBySlug(publicationSlug);
      if (!pubData) return [];

      const supabase = createSupabasePublicServerClient();
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
  },
);

export const fetchExploreInitialData = cache(
  async (
    limit = 20,
    offset = 0,
  ): Promise<{
    posts: PostWithAuthor[];
    tags: string[];
    error: string | null;
  }> => {
    try {
      const supabase = createSupabasePublicServerClient();
      const end = offset + limit - 1;
      const { data, error } = await supabase
        .from("posts")
        .select(LEGACY_POSTS_WITH_AUTHOR_SELECT)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(offset, end);

      if (error) {
        return {
          posts: [],
          tags: [],
          error: error.message,
        };
      }

      const posts = (data || []) as PostWithAuthor[];
      const tags = normalizeTags(posts);

      return { posts, tags, error: null };
    } catch (e) {
      return {
        posts: [],
        tags: [],
        error: e instanceof Error ? e.message : "Failed to load explore data",
      };
    }
  },
);

export type JournalSort = "latest" | "popular";
export type JournalFormatFilter = "all" | "poetry" | "prose";

export type JournalQueryOptions = {
  limit?: number;
  offset?: number;
  sort?: JournalSort;
  format?: JournalFormatFilter;
  tag?: string;
};

async function queryJournalPosts(
  options: JournalQueryOptions,
): Promise<{ posts: PostWithAuthor[]; error: string | null }> {
  const {
    limit = 12,
    offset = 0,
    sort = "latest",
    format = "all",
    tag,
  } = options;

  try {
    const supabase = createSupabasePublicServerClient();
    const end = offset + limit - 1;

    let query = supabase
      .from("posts")
      .select(LEGACY_POSTS_WITH_AUTHOR_SELECT)
      .eq("status", "published")
      .is("publication_id", null);

    if (format === "poetry" || format === "prose") {
      query = query.eq("format", format);
    }

    if (tag?.trim()) {
      query = query.contains("tags", [tag.trim()]);
    }

    // Popular: over-fetch then rank by likes so pagination still advances.
    if (sort === "popular") {
      const fetchLimit = Math.min(offset + limit + 24, 120);
      const { data, error } = await query
        .order("published_at", { ascending: false })
        .range(0, fetchLimit - 1);

      if (error) {
        return { posts: [], error: error.message };
      }

      const ranked = ([...(data || [])] as PostWithAuthor[]).sort(
        (a, b) =>
          (b.likes?.[0]?.count || 0) - (a.likes?.[0]?.count || 0) ||
          new Date(b.published_at || b.created_at).getTime() -
            new Date(a.published_at || a.created_at).getTime(),
      );

      return { posts: ranked.slice(offset, offset + limit), error: null };
    }

    const { data, error } = await query
      .order("published_at", { ascending: false })
      .range(offset, end);

    if (error) {
      return { posts: [], error: error.message };
    }

    return { posts: (data || []) as PostWithAuthor[], error: null };
  } catch (e) {
    return {
      posts: [],
      error: e instanceof Error ? e.message : "Failed to load journal posts",
    };
  }
}

export const fetchJournalInitialData = cache(
  async (
    options: JournalQueryOptions = {},
  ): Promise<{
    posts: PostWithAuthor[];
    tags: string[];
    error: string | null;
  }> => {
    try {
      const supabase = createSupabasePublicServerClient();
      const [{ posts, error }, tagsRes] = await Promise.all([
        queryJournalPosts(options),
        supabase
          .from("posts")
          .select("tags")
          .eq("status", "published")
          .is("publication_id", null)
          .not("tags", "is", null)
          .limit(60),
      ]);

      if (error) {
        return { posts: [], tags: [], error };
      }

      const tags = normalizeTags(
        (tagsRes.data || []) as { tags: string[] | null }[],
      );

      return { posts, tags, error: null };
    } catch (e) {
      return {
        posts: [],
        tags: [],
        error: e instanceof Error ? e.message : "Failed to load journal data",
      };
    }
  },
);

export async function fetchJournalPostsPage(
  options: JournalQueryOptions,
): Promise<{ posts: PostWithAuthor[]; error: string | null }> {
  return queryJournalPosts(options);
}

export const fetchPostBySlugForPage = cache(
  async (slug: string): Promise<PostWithAuthor | null> => {
    const supabase = createSupabasePublicServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select(LEGACY_POSTS_WITH_AUTHOR_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) return null;
    return data as PostWithAuthor;
  },
);

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
    .maybeSingle();

  if (profileError || !profile) {
    return { profile: null, posts: [] };
  }

  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select("*, likes(count), comments(count)")
    .eq("author_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(24);

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

  const [countRes, followRes] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profileUserId),
    viewerId && viewerId !== profileUserId
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", viewerId)
          .eq("following_id", profileUserId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    isFollowing: Boolean(followRes.data),
    followerCount: countRes.count ?? 0,
  };
}
