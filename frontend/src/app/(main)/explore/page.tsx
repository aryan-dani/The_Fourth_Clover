import { ExplorePageClient } from "./explore-client";
import { fetchExploreInitialData } from "@/features/data/server-queries";

const EXPLORE_PAGE_SIZE = 20;

export default async function ExplorePage() {
  const { posts, tags, error } = await fetchExploreInitialData(
    EXPLORE_PAGE_SIZE,
    0
  );
  const initialHasMore = posts.length === EXPLORE_PAGE_SIZE;

  return (
    <ExplorePageClient
      initialPosts={posts}
      initialTags={tags}
      initialLoadError={error}
      pageSize={EXPLORE_PAGE_SIZE}
      initialHasMore={initialHasMore}
    />
  );
}
