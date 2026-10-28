"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  LayoutGrid,
  List,
  PenTool,
  X,
} from "lucide-react";
import { ArticleCard, EmptyState, LoadMore } from "@/components/editorial";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { loadMoreJournalPostsAction } from "@/features/data/server-actions";
import { toTitleCase } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";
import type {
  JournalFormatFilter,
  JournalSort,
} from "@/features/data/server-queries";

type JournalView = "cards" | "list";

type JournalPageClientProps = {
  initialPosts: PostWithAuthor[];
  initialTags: string[];
  initialLoadError: string | null;
  pageSize: number;
  initialHasMore: boolean;
  initialSort: JournalSort;
  initialFormat: JournalFormatFilter;
  initialTag: string;
};

function buildJournalHref(opts: {
  sort: JournalSort;
  format: JournalFormatFilter;
  tag: string;
}): string {
  const params = new URLSearchParams();
  if (opts.sort !== "latest") params.set("sort", opts.sort);
  if (opts.format !== "all") params.set("format", opts.format);
  if (opts.tag) params.set("tag", opts.tag);
  const qs = params.toString();
  return qs ? `/journal?${qs}` : "/journal";
}

function FilterChip({
  active,
  children,
  href,
}: {
  active: boolean;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      data-active={active ? "true" : "false"}
      className="btn-chip"
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function JournalPageClient({
  initialPosts,
  initialTags,
  initialLoadError,
  pageSize,
  initialHasMore,
  initialSort,
  initialFormat,
  initialTag,
}: JournalPageClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [tags] = useState(initialTags);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadError, setLoadError] = useState(initialLoadError);
  const [loadingMore, startLoadMore] = useTransition();
  const [view, setView] = useState<JournalView>("cards");

  const sort = initialSort;
  const format = initialFormat;
  const selectedTag = initialTag;

  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialHasMore);
    setLoadError(initialLoadError);
  }, [initialPosts, initialHasMore, initialLoadError]);

  const hrefFor = useCallback(
    (next: Partial<{ sort: JournalSort; format: JournalFormatFilter; tag: string }>) =>
      buildJournalHref({
        sort: next.sort ?? sort,
        format: next.format ?? format,
        tag: next.tag !== undefined ? next.tag : selectedTag,
      }),
    [sort, format, selectedTag],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadError(null);
    startLoadMore(async () => {
      try {
        const next = await loadMoreJournalPostsAction({
          limit: pageSize,
          offset: posts.length,
          sort,
          format,
          tag: selectedTag || undefined,
        });
        setPosts((prev) => [...prev, ...next]);
        setHasMore(next.length === pageSize);
      } catch (err) {
        console.error("Journal load more:", err);
        setLoadError(
          "We couldn’t load more journal entries. Check your connection and try again.",
        );
      }
    });
  }, [hasMore, loadingMore, pageSize, posts.length, sort, format, selectedTag]);

  const featuredTags = useMemo(() => tags.slice(0, 6), [tags]);
  const hasActiveFilters = format !== "all" || Boolean(selectedTag);

  return (
    <div className="wrap space-y-10 py-10 md:py-14">
      <header className="border-b border-[var(--fg-line)] pb-8">
        <p className="type-label text-muted-foreground">Journal</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="type-display text-[clamp(2.5rem,7vw,4.5rem)]">
              The Journal
            </h1>
            <p className="type-body mt-4">
              Essays, verse, and community writing — open to every signed-in
              author.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/tech-weekly" className="btn-editorial !py-2.5 !px-4 text-[0.65rem]">
              Tech Weekly
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link href="/write" className="btn-editorial !py-2.5 !px-4 text-[0.65rem]">
              <PenTool className="h-3.5 w-3.5" aria-hidden />
              Write
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-4 border-b border-[var(--fg-line)] pb-6">
        <div className="panel space-y-4 p-4 sm:p-5" role="toolbar" aria-label="Journal filters">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <span className="type-label text-muted-foreground">Sort</span>
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip active={sort === "latest"} href={hrefFor({ sort: "latest" })}>
                  Latest
                </FilterChip>
                <FilterChip
                  active={sort === "popular"}
                  href={hrefFor({ sort: "popular" })}
                >
                  Popular
                </FilterChip>
              </div>
            </div>

            <div className="space-y-2">
              <span className="type-label text-muted-foreground">Format</span>
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "prose", label: "Prose" },
                    { id: "poetry", label: "Poetry" },
                  ] as const
                ).map((item) => (
                  <FilterChip
                    key={item.id}
                    active={format === item.id}
                    href={hrefFor({ format: item.id })}
                  >
                    {item.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="type-label text-muted-foreground">Layout</span>
              <div
                className="inline-flex items-center gap-1"
                role="group"
                aria-label="Journal layout"
              >
                <button
                  type="button"
                  data-active={view === "cards" ? "true" : "false"}
                  className="btn-chip !px-3 !py-2"
                  aria-pressed={view === "cards"}
                  onClick={() => setView("cards")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only sm:not-sr-only">Cards</span>
                </button>
                <button
                  type="button"
                  data-active={view === "list" ? "true" : "false"}
                  className="btn-chip !px-3 !py-2"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only sm:not-sr-only">List</span>
                </button>
              </div>
            </div>
          </div>

          {featuredTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--fg-line)] pt-4">
              <span className="type-label mr-1 text-muted-foreground">Topics</span>
              {featuredTags.map((tag) => (
                <Link
                  key={tag}
                  href={hrefFor({
                    tag: selectedTag === tag ? "" : tag,
                  })}
                  data-active={selectedTag === tag ? "true" : "false"}
                  className="btn-chip !normal-case !tracking-normal !text-[0.78rem]"
                >
                  {toTitleCase(tag)}
                </Link>
              ))}
              <Link href="/tags" className="type-label link-u ml-1 text-muted-foreground">
                All topics →
              </Link>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Showing</span>
            {format !== "all" && (
              <span className="rounded-full border border-[var(--fg-line)] px-2.5 py-0.5 text-xs text-foreground">
                {format === "poetry" ? "Poetry" : "Prose"}
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--fg-line)] px-2.5 py-0.5 text-xs text-foreground">
                {toTitleCase(selectedTag)}
                <Link
                  href={hrefFor({ tag: "" })}
                  aria-label={`Clear topic ${selectedTag}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </Link>
              </span>
            )}
            <Link
              href="/journal"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear
            </Link>
          </div>
        )}
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>{loadError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-hairline"
              onClick={() => router.refresh()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {posts.length === 0 && !loadError ? (
        <EmptyState
          title="No matching entries"
          description="Try another format, topic, or clear filters to browse the full journal."
          action={
            <Link href="/journal" className="btn-editorial">
              Clear filters
            </Link>
          }
        />
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <ArticleCard
              key={post.id}
              section="journal"
              variant="standard"
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              coverImage={post.cover_image || post.featured_image}
              author={post.author}
              publishedAt={post.published_at || post.created_at}
              readTime={post.read_time}
              tags={post.tags}
              format={post.format === "poetry" ? "poetry" : "prose"}
              reactionCount={post.likes?.[0]?.count}
              commentCount={post.comments?.[0]?.count}
              priority={index < 3}
            />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-[var(--fg-line)] border-t border-[var(--fg-line)]">
          {posts.map((post) => {
            const author =
              post.author?.full_name || post.author?.username || "Author";
            const when = post.published_at || post.created_at;
            const date = when
              ? new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(when))
              : "";
            return (
              <li key={post.id}>
                <Link
                  href={`/post/${post.slug}`}
                  className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <div className="min-w-0">
                    <p className="type-label text-muted-foreground">
                      {post.format === "poetry" ? "Poetry" : "Prose"}
                      {post.read_time ? ` · ${post.read_time} min` : ""}
                    </p>
                    <h2 className="type-display mt-2 text-[clamp(1.25rem,3vw,1.85rem)] transition-opacity group-hover:opacity-70">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="type-body mt-2 line-clamp-2 max-w-2xl text-sm">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  <span className="type-label shrink-0 text-muted-foreground">
                    {author}
                    {date ? ` · ${date}` : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && posts.length > 0 && (
        <LoadMore
          onClick={loadMore}
          loading={loadingMore}
          disabled={loadingMore}
        >
          Load more entries
        </LoadMore>
      )}
    </div>
  );
}
