"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toTitleCase } from "@/lib/utils";
import { RelativeTime } from "@/components/time/RelativeTime";
import {
  Search,
  Heart,
  MessageCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { loadMoreExplorePostsAction } from "@/features/data/server-actions";
import { getAllTags } from "@/features/data/database-operations";
import { PostWithAuthor } from "@/types/database";

type ExplorePageClientProps = {
  initialPosts: PostWithAuthor[];
  initialTags: string[];
  initialLoadError: string | null;
  pageSize: number;
  initialHasMore: boolean;
};

export function ExplorePageClient({
  initialPosts,
  initialTags,
  initialLoadError,
  pageSize,
  initialHasMore,
}: ExplorePageClientProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [allTags, setAllTags] = useState<string[]>(initialTags);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "trending" | "popular">(
    "latest"
  );

  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialHasMore);
    setAllTags(initialTags);
  }, [initialPosts, initialHasMore, initialTags]);

  const loadExploreData = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [postsResult, tagsResult] = await Promise.all([
        loadMoreExplorePostsAction(pageSize, 0),
        getAllTags(),
      ]);

      const nextPosts = postsResult as PostWithAuthor[];
      setPosts(nextPosts);
      setHasMore(nextPosts.length === pageSize);
      setAllTags(tagsResult || []);
    } catch (error) {
      console.error("Error fetching explore page data:", error);
      setLoadError(
        "We couldn't load archive entries right now. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadError(null);
    setLoadingMore(true);
    try {
      const next = await loadMoreExplorePostsAction(pageSize, posts.length);
      setPosts((prev) => [...prev, ...next]);
      setHasMore(next.length === pageSize);
    } catch (error) {
      console.error("Error loading more posts:", error);
      setLoadError(
        "We couldn't load more entries. Check your connection and try again."
      );
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, pageSize, posts.length]);

  const filteredPosts = useMemo(() => {
    let filtered: PostWithAuthor[] = [...posts];

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post: PostWithAuthor) =>
          post.title.toLowerCase().includes(lowercasedTerm) ||
          (post.excerpt &&
            post.excerpt.toLowerCase().includes(lowercasedTerm)) ||
          post.author.full_name?.toLowerCase().includes(lowercasedTerm)
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((post: PostWithAuthor) =>
        post.tags?.includes(selectedTag)
      );
    }

    switch (sortBy) {
      case "trending":
        filtered.sort(
          (a: PostWithAuthor, b: PostWithAuthor) =>
            (b.likes[0]?.count || 0) +
            (b.comments[0]?.count || 0) -
            ((a.likes[0]?.count || 0) + (a.comments[0]?.count || 0))
        );
        break;
      case "popular":
        filtered.sort(
          (a: PostWithAuthor, b: PostWithAuthor) =>
            (b.likes[0]?.count || 0) - (a.likes[0]?.count || 0)
        );
        break;
      case "latest":
      default:
        filtered.sort(
          (a: PostWithAuthor, b: PostWithAuthor) =>
            new Date(b.published_at || b.created_at).getTime() -
            new Date(a.published_at || a.created_at).getTime()
        );
        break;
    }

    return filtered;
  }, [posts, searchTerm, selectedTag, sortBy]);

  const canPaginateServer = !searchTerm && !selectedTag;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        {/* Masthead */}
        <header className="border-b border-border pb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            <span>THE FOURTH CLOVER · OPEN JOURNAL ARCHIVE</span>
            <Link
              href="/tech-weekly"
              className="inline-flex items-center gap-1 text-foreground hover:underline"
            >
              CSI TECH WEEKLY ISSUES
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7 space-y-2">
              <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.08]">
                The Journal Archive
              </h1>
              <p className="font-serif text-lg text-muted-foreground leading-relaxed">
                Long-form essays, engineering notes, and community dispatches
                published on The Fourth Clover.
              </p>
            </div>

            {/* Search & Sort Controls */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search essays, authors, topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-md bg-card"
                />
              </div>

              <div className="inline-flex rounded-md border border-border bg-card p-0.5 shrink-0">
                {(
                  [
                    { id: "latest", label: "Latest" },
                    { id: "trending", label: "Active" },
                    { id: "popular", label: "Top" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSortBy(item.id)}
                    className={`rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                      sortBy === item.id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Topic Taxonomy Strip */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTag("")}
                className={`px-2.5 py-1 rounded-sm font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  selectedTag === ""
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                All Topics
              </button>
              {allTags.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? "" : tag)
                  }
                  className={`px-2.5 py-1 rounded-sm font-mono text-[11px] uppercase tracking-wider transition-colors ${
                    selectedTag === tag
                      ? "bg-foreground text-background"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {toTitleCase(tag)}
                </button>
              ))}
            </div>
          )}
        </header>

        {loadError && (
          <Alert variant="destructive" className="rounded-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4 text-xs">
              <span>{loadError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadExploreData()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Archive Grid */}
        {loading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-6 space-y-4 animate-pulse"
              >
                <div className="aspect-[16/10] bg-muted rounded-sm" />
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-14 text-center space-y-2">
            <h3 className="font-display text-xl font-semibold text-foreground">
              No matching entries found
            </h3>
            <p className="text-sm text-muted-foreground">
              Adjust your search query or topic filter to view published essays.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <article key={post.id}
                className="group flex flex-col justify-between rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-foreground/35">
                <div>
                  {post.cover_image && (
                    <Link
                      href={`/post/${post.slug}`}
                      className="block relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-muted"
                    >
                      <Image
                        src={post.cover_image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={index < 3}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </Link>
                  )}

                  <div className="p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>
                        {post.tags && post.tags.length > 0
                          ? toTitleCase(post.tags[0])
                          : "Essay"}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="h-3 w-3" />
                        {post.read_time} min
                      </span>
                    </div>

                    <h2 className="font-display text-xl font-semibold tracking-tight text-foreground leading-snug line-clamp-2">
                      <Link
                        href={`/post/${post.slug}`}
                        className="group-hover:underline decoration-1 underline-offset-4"
                      >
                        {post.title}
                      </Link>
                    </h2>

                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/80 px-6 py-3.5 text-xs text-muted-foreground">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="flex items-center gap-2 hover:text-foreground truncate"
                  >
                    <Avatar className="h-5 w-5 rounded-sm border border-border">
                      <AvatarImage src={post.author.avatar_url || ""} />
                      <AvatarFallback className="rounded-sm font-mono text-[10px]">
                        {post.author.full_name?.[0] || post.author.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground truncate">
                      {post.author.full_name || post.author.username}
                    </span>
                  </Link>

                  <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums shrink-0">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post.likes[0]?.count || 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.comments[0]?.count || 0}
                    </span>
                    <RelativeTime
                      date={post.published_at || post.created_at}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {canPaginateServer && hasMore && filteredPosts.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loadingMore}
              onClick={() => void loadMorePosts()}
              className="rounded-md px-6 text-xs font-mono uppercase tracking-wider bg-card"
            >
              {loadingMore ? "Loading Archive..." : "Load More Entries"}
            </Button>
          </div>
        )}
      </div>
  );
}
