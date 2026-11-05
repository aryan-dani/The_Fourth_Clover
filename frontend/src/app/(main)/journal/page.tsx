import { fetchJournalInitialData } from "@/features/data/server-queries";
import { JournalPageClient } from "./journal-client";

const JOURNAL_PAGE_SIZE = 12;

export const revalidate = 60;
export const dynamic = "force-static";
export const fetchCache = "force-cache";

export default async function JournalPage() {
  const { posts, tags, error } = await fetchJournalInitialData({
    limit: JOURNAL_PAGE_SIZE,
    offset: 0,
    sort: "latest",
    format: "all",
  });
  const initialHasMore = posts.length === JOURNAL_PAGE_SIZE;

  return (
    <JournalPageClient
      initialPosts={posts}
      initialTags={tags}
      initialLoadError={error}
      pageSize={JOURNAL_PAGE_SIZE}
      initialHasMore={initialHasMore}
      initialSort="latest"
      initialFormat="all"
      initialTag=""
    />
  );
}
