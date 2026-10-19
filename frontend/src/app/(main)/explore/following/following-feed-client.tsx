"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, BookOpen } from "lucide-react";
import {
  ArticleCard,
  EmptyState,
  LoadMore,
  PageHeader,
} from "@/components/editorial";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getPostsByFollowingAuthors } from "@/features/data/database-operations";
import type { PostWithAuthor } from "@/types/database";

type FollowingFeedClientProps = {
  viewerId: string;
  initialPosts: PostWithAuthor[];
  initialLoadError: string | null;
  pageSize: number;
  initialHasMore: boolean;
  accountsYouFollow: number;
};

export function FollowingFeedClient({
  viewerId,
  initialPosts,
  initialLoadError,
  pageSize,
  initialHasMore,
  accountsYouFollow,
}: FollowingFeedClientProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, startLoadMore] = useTransition();

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadError(null);
    startLoadMore(async () => {
      try {
        const { data, error } = await getPostsByFollowingAuthors(
          viewerId,
          pageSize,
          posts.length,
        );
        if (error) throw error;
        const next = (data || []) as PostWithAuthor[];
        setPosts((prev) => [...prev, ...next]);
        setHasMore(next.length === pageSize);
      } catch (e) {
        console.error("Following feed load more:", e);
        setLoadError(
          "We couldn’t load more from people you follow. Try again in a moment.",
        );
      }
    });
  }, [hasMore, loadingMore, viewerId, pageSize, posts.length]);

  const emptyNoWriters =
    posts.length === 0 && !loadError && accountsYouFollow === 0;
  const emptyQuietFeed =
    posts.length === 0 && !loadError && accountsYouFollow > 0;

  return (
    <div className="mx-auto max-w-content space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        label="Following"
        title="From people you follow"
        description="New publishes from writers you care about, newest first."
        actions={
          <Button asChild variant="outline" size="sm" className="border-hairline">
            <Link href="/journal">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Browse Journal
            </Link>
          </Button>
        }
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {emptyNoWriters ? (
        <EmptyState
          title="You’re not following anyone yet"
          description="Find writers on the Journal and follow them from their profile."
          action={
            <Button asChild>
              <Link href="/journal">Go to Journal</Link>
            </Button>
          }
        />
      ) : emptyQuietFeed ? (
        <EmptyState
          title="Quiet for now"
          description="No published posts from people you follow yet. Check back soon, or discover more writers."
          action={
            <Button asChild variant="outline" className="border-hairline">
              <Link href="/journal">Explore writers</Link>
            </Button>
          }
        />
      ) : posts.length > 0 ? (
        <>
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

          {hasMore && (
            <LoadMore
              onClick={loadMore}
              loading={loadingMore}
              disabled={loadingMore}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
