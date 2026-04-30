"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatRelativeTime } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageShell } from "@/components/layout/PageShell";
import { motionEase } from "@/lib/motion";
import {
  Heart,
  MessageCircle,
  Clock,
  AlertCircle,
  BookOpen,
} from "lucide-react";
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
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadError(null);
    setLoadingMore(true);
    try {
      const { data, error } = await getPostsByFollowingAuthors(
        viewerId,
        pageSize,
        posts.length
      );
      if (error) throw error;
      const next = (data || []) as PostWithAuthor[];
      setPosts((prev) => [...prev, ...next]);
      setHasMore(next.length === pageSize);
    } catch (e) {
      console.error("Following feed load more:", e);
      setLoadError(
        "We couldn't load more from people you follow. Try again in a moment."
      );
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, viewerId, pageSize, posts.length]);

  const emptyNoWriters = posts.length === 0 && !loadError && accountsYouFollow === 0;
  const emptyQuietFeed =
    posts.length === 0 && !loadError && accountsYouFollow > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 pb-8">
        <PageShell variant="wide">
          {loadError && posts.length === 0 ? (
            <div className="py-10 sm:py-14">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/explore"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Back to Explore
                </Link>
              </p>
            </div>
          ) : (
            <>
              {loadError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loadError}</AlertDescription>
                </Alert>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: motionEase }}
                className="text-center mb-8 px-1 sm:px-0"
              >
                <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl mb-4 leading-tight">
                  From people you{" "}
                  <span className="gradient-text">follow</span>
                </h1>
                <p className="font-serif text-lg text-muted-foreground max-w-xl mx-auto">
                  New publishes from writers you care about, newest first.
                </p>
                <p className="mt-4 text-sm">
                  <Link
                    href="/explore"
                    className="text-primary font-medium underline-offset-4 hover:underline inline-flex items-center gap-1"
                  >
                    <BookOpen className="w-4 h-4" />
                    Discover more on Explore
                  </Link>
                </p>
              </motion.div>

              {emptyNoWriters ? (
                <div className="text-center py-16 max-w-md mx-auto">
                  <p className="text-muted-foreground mb-6">
                    You&apos;re not following anyone yet. Find writers on
                    Explore and follow them from their profile.
                  </p>
                  <Button asChild>
                    <Link href="/explore">Go to Explore</Link>
                  </Button>
                </div>
              ) : emptyQuietFeed ? (
                <div className="text-center py-16 max-w-md mx-auto">
                  <p className="text-muted-foreground mb-6">
                    No published posts from people you follow yet. Check back
                    soon, or discover more writers on Explore.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/explore">Explore writers</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                    {posts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06 }}
                        className="break-inside-avoid mb-8"
                      >
                        <Link href={`/post/${post.slug}`} className="block">
                          <Card className="group overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 glass border-2 hover:border-primary/30 hover:-translate-y-2 cursor-pointer">
                            {post.cover_image && (
                              <div className="aspect-video overflow-hidden relative">
                                <Image
                                  src={post.cover_image}
                                  alt={post.title}
                                  width={640}
                                  height={360}
                                  unoptimized
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  sizes="(max-width: 768px) 100vw, (max-width:1200px) 50vw, 33vw"
                                />
                              </div>
                            )}
                            <CardContent className="p-6 flex flex-col flex-1">
                              <div className="flex items-center space-x-4 mb-4">
                                <Avatar className="ring-2 ring-primary/10">
                                  <AvatarImage
                                    src={post.author.avatar_url || ""}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                                    {post.author.full_name?.[0] || "A"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-sm">
                                    {post.author.full_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    @{post.author.username}
                                  </p>
                                </div>
                              </div>
                              <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {post.title}
                              </h3>
                              <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                                {post.excerpt}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-primary/10">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{post.read_time}m read</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Heart className="w-3.5 h-3.5" />
                                    <span>{post.likes[0]?.count || 0}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>{post.comments[0]?.count || 0}</span>
                                  </div>
                                </div>
                                <span>
                                  {post.published_at
                                    ? formatRelativeTime(post.published_at)
                                    : ""}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {hasMore && (
                    <div className="text-center mt-8">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={loadingMore}
                        onClick={() => void loadMore()}
                      >
                        {loadingMore ? "Loading…" : "Load more"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </PageShell>
      </main>
      <Footer />
    </div>
  );
}
