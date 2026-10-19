import { cache } from "react";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";
import type {
  PostWithAuthor,
  TechSubmissionWithAuthor,
  TechWeek,
} from "@/types/database";
import { LEGACY_POSTS_WITH_AUTHOR_SELECT } from "@/features/data/server-queries";

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

export type PopularTag = {
  tag: string;
  count: number;
};

function tagMatches(tags: string[] | null | undefined, needle: string): boolean {
  if (!tags?.length) return false;
  const lower = needle.trim().toLowerCase();
  return tags.some((t) => t.trim().toLowerCase() === lower);
}

/** Aggregate popular tags from published journal posts (by frequency). */
export const listPopularTags = cache(
  async (limit = 48): Promise<PopularTag[]> => {
    const supabase = createSupabasePublicServerClient();
    const { data } = await supabase
      .from("posts")
      .select("tags")
      .eq("status", "published")
      .is("publication_id", null)
      .not("tags", "is", null)
      .limit(400);

    const counts = new Map<string, { tag: string; count: number }>();
    for (const row of data || []) {
      for (const raw of (row.tags as string[] | null) || []) {
        const trimmed = raw?.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        const existing = counts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(key, { tag: trimmed, count: 1 });
        }
      }
    }

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, Math.min(Math.max(limit, 1), 200));
  },
);

export const fetchTagPageContent = cache(
  async (
    tagParam: string,
  ): Promise<{
    tag: string;
    displayTag: string;
    posts: PostWithAuthor[];
    submissions: TechSubmissionWithAuthor[];
  }> => {
    const decoded = decodeURIComponent(tagParam).trim();
    const tagLower = decoded.toLowerCase();
    const supabase = createSupabasePublicServerClient();

    const [postsRes, techRes, popular] = await Promise.all([
      supabase
        .from("posts")
        .select(LEGACY_POSTS_WITH_AUTHOR_SELECT)
        .eq("status", "published")
        .is("publication_id", null)
        .not("tags", "is", null)
        .order("published_at", { ascending: false })
        .limit(120),
      supabase
        .from("tech_submissions")
        .select(
          `
          id, week_id, author_id, title, slug, summary, cover_image, tags, word_count,
          read_time, status, selected_by, selected_at, reviewed_by, reviewed_at, review_note,
          is_deleted, created_at, updated_at,
          author:profiles!tech_submissions_author_id_fkey (${AUTHOR_BADGE_SELECT})
        `,
        )
        .eq("is_deleted", false)
        .in("status", ["submitted", "approved", "selected", "archived"])
        .not("tags", "is", null)
        .order("created_at", { ascending: false })
        .limit(120),
      listPopularTags(200),
    ]);

    const posts = ((postsRes.data || []) as PostWithAuthor[]).filter((p) =>
      tagMatches(p.tags, tagLower),
    );
    const submissions = (
      (techRes.data || []) as unknown as TechSubmissionWithAuthor[]
    ).filter((s) => tagMatches(s.tags, tagLower));

    const displayTag =
      popular.find((t) => t.tag.toLowerCase() === tagLower)?.tag ||
      posts[0]?.tags?.find((t) => t.toLowerCase() === tagLower) ||
      submissions[0]?.tags?.find((t) => t.toLowerCase() === tagLower) ||
      decoded;

    return {
      tag: tagLower,
      displayTag,
      posts,
      submissions,
    };
  },
);

export const listTechWeeks = cache(async (limit = 52): Promise<TechWeek[]> => {
  const supabase = createSupabasePublicServerClient();
  const { data } = await supabase
    .from("tech_weeks")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  return (data || []) as TechWeek[];
});

export const fetchTechWeekById = cache(
  async (
    weekId: string,
  ): Promise<{
    week: TechWeek | null;
    submissions: TechSubmissionWithAuthor[];
  }> => {
    const supabase = createSupabasePublicServerClient();
    const [{ data: week }, { data: subs }] = await Promise.all([
      supabase.from("tech_weeks").select("*").eq("id", weekId).maybeSingle(),
      supabase
        .from("tech_submissions")
        .select(
          `
          id, week_id, author_id, title, slug, summary, cover_image, tags, word_count,
          read_time, status, selected_by, selected_at, reviewed_by, reviewed_at, review_note,
          is_deleted, created_at, updated_at,
          author:profiles!tech_submissions_author_id_fkey (${AUTHOR_BADGE_SELECT})
        `,
        )
        .eq("week_id", weekId)
        .eq("is_deleted", false)
        .in("status", ["submitted", "approved", "selected", "archived"])
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

    return {
      week: (week as TechWeek | null) ?? null,
      submissions: (subs || []) as unknown as TechSubmissionWithAuthor[],
    };
  },
);

export async function listTechSubmissionSlugsForSitemap(
  limit = 2000,
): Promise<{ slug: string; updated_at: string | null }[]> {
  const supabase = createSupabasePublicServerClient();
  const { data } = await supabase
    .from("tech_submissions")
    .select("slug, updated_at")
    .eq("is_deleted", false)
    .in("status", ["submitted", "approved", "selected", "archived"])
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data || []) as { slug: string; updated_at: string | null }[];
}

export async function listPopularTagSlugsForSitemap(
  limit = 80,
): Promise<string[]> {
  const tags = await listPopularTags(limit);
  return tags.map((t) => t.tag.toLowerCase());
}
