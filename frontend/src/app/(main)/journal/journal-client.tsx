"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUpRight, PenTool, X } from "lucide-react";
import {
  ArticleCard,
  EmptyState,
  LoadMore,
  PageHeader,
} from "@/components/editorial";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { loadMoreJournalPostsAction } from "@/features/data/server-actions";
import { toTitleCase, cn } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";
import type {
  JournalFormatFilter,
  JournalSort,
} from "@/features/data/server-queries";

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

function TextToggle({
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
      className={cn(
        "text-sm transition-colors duration-editorial",
        active
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
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
    <div className="mx-auto max-w-content space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        label="Journal"
        title="The Journal"
        description="Essays, verse, and community writing published on The Fourth Clover — open to every signed-in author."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-hairline">
              <Link href="/tech-weekly">
                Tech Weekly
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/write">
                <PenTool className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Write
              </Link>
            </Button>
          </div>
        }
      />

      {/* Single quiet filter bar — no chip walls */}
      <div className="space-y-3 border-b border-hairline pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <TextToggle active={sort === "latest"} href={hrefFor({ sort: "latest" })}>
              Latest
            </TextToggle>
            <span className="text-muted-foreground/40" aria-hidden>
              ·
            </span>
            <TextToggle
              active={sort === "popular"}
              href={hrefFor({ sort: "popular" })}
            >
              Popular
            </TextToggle>
          </div>

          <div className="flex items-center gap-3">
            {(
              [
                { id: "all", label: "All" },
                { id: "prose", label: "Prose" },
                { id: "poetry", label: "Poetry" },
              ] as const
            ).map((item, i) => (
              <span key={item.id} className="inline-flex items-center gap-3">
                {i > 0 && (
                  <span className="text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                )}
                <TextToggle
                  active={format === item.id}
                  href={hrefFor({ format: item.id })}
                >
                  {item.label}
                </TextToggle>
              </span>
            ))}
          </div>
        </div>

        {featuredTags.length > 0 && (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Topics
            </span>
            {featuredTags.map((tag) => (
              <Link
                key={tag}
                href={hrefFor({
                  tag: selectedTag === tag ? "" : tag,
                })}
                className={cn(
                  "transition-colors duration-editorial",
                  selectedTag === tag
                    ? "font-medium text-foreground underline decoration-brand/50 underline-offset-4"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {toTitleCase(tag)}
              </Link>
            ))}
            <Link
              href="/tags"
              className="text-muted-foreground transition-colors duration-editorial hover:text-foreground"
            >
              All topics →
            </Link>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Showing</span>
            {format !== "all" && (
              <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-foreground">
                {format === "poetry" ? "Poetry" : "Prose"}
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-xs text-foreground">
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
            <Button asChild variant="outline" className="border-hairline">
              <Link href="/journal">Clear filters</Link>
            </Button>
          }
        />
      ) : (
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
