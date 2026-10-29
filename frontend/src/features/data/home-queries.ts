import { createSupabasePublicServerClient } from "@/lib/supabase/server";
import { fetchTechWeeklyLandingData } from "@/features/data/tech-weekly-actions";
import type { PostWithAuthor, TechSubmissionWithAuthor } from "@/types/database";

export type HomeData = {
  featuredPick: TechSubmissionWithAuthor | null;
  latestTech: TechSubmissionWithAuthor[];
  journalLead: PostWithAuthor | null;
  journalLatest: PostWithAuthor[];
  poetry: PostWithAuthor[];
  cutoffAt: string | null;
  weekTitle: string | null;
};

const POST_SELECT = `
  *,
  author:profiles!posts_author_id_fkey (
    id, username, full_name, avatar_url
  ),
  likes(count),
  comments(count)
`;

export async function fetchHomeData(): Promise<HomeData> {
  const supabase = createSupabasePublicServerClient();

  const [techSlice, journalRes, poetryRes] = await Promise.all([
    fetchTechWeeklyLandingData(),
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .is("publication_id", null)
      .order("published_at", { ascending: false })
      .limit(7),
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .is("publication_id", null)
      .eq("format", "poetry")
      .order("published_at", { ascending: false })
      .limit(4),
  ]);

  const journalPosts = (journalRes.data || []) as unknown as PostWithAuthor[];
  const poetry = (poetryRes.data || []) as unknown as PostWithAuthor[];

  return {
    featuredPick: techSlice.featuredPick,
    latestTech: (techSlice.submissions || []).slice(0, 3),
    journalLead: journalPosts[0] || null,
    journalLatest: journalPosts.slice(1, 7),
    poetry,
    cutoffAt: techSlice.currentWeek?.cutoff_at || null,
    weekTitle: techSlice.currentWeek?.title || null,
  };
}
