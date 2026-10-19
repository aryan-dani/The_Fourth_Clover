import {
  fetchJournalInitialData,
  type JournalFormatFilter,
  type JournalSort,
} from "@/features/data/server-queries";
import { JournalPageClient } from "./journal-client";

const JOURNAL_PAGE_SIZE = 12;

export const revalidate = 15;

type JournalSearchParams = {
  sort?: string;
  format?: string;
  tag?: string;
};

function parseSort(value: string | undefined): JournalSort {
  return value === "popular" ? "popular" : "latest";
}

function parseFormat(value: string | undefined): JournalFormatFilter {
  if (value === "poetry" || value === "prose") return value;
  return "all";
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<JournalSearchParams>;
}) {
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const format = parseFormat(params.format);
  const tag = params.tag?.trim() || "";

  const { posts, tags, error } = await fetchJournalInitialData({
    limit: JOURNAL_PAGE_SIZE,
    offset: 0,
    sort,
    format,
    tag: tag || undefined,
  });
  const initialHasMore = posts.length === JOURNAL_PAGE_SIZE;

  return (
    <JournalPageClient
      initialPosts={posts}
      initialTags={tags}
      initialLoadError={error}
      pageSize={JOURNAL_PAGE_SIZE}
      initialHasMore={initialHasMore}
      initialSort={sort}
      initialFormat={format}
      initialTag={tag}
    />
  );
}
