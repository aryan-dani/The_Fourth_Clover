"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/layout/PageShell";
import { motionEase } from "@/lib/motion";
import { formatRelativeTime, toTitleCase } from "@/lib/utils";
import { loadMorePublicationPostsAction } from "@/features/data/server-actions";
import type {
  PostWithAuthor,
  Publication,
  PublicationMemberWithProfile,
  PublicationRole,
} from "@/types/database";
import {
  Search,
  Heart,
  MessageCircle,
  Clock,
  TrendingUp,
  Calendar,
  AlertCircle,
  PenTool,
  ShieldCheck,
  Rss,
  Sparkles,
  Users,
  ArrowRight,
  Terminal,
} from "lucide-react";

type CsiLandingClientProps = {
  publication: Publication;
  initialPosts: PostWithAuthor[];
  initialTags: string[];
  members: PublicationMemberWithProfile[];
  viewerRole: PublicationRole | null;
  reviewQueueCount: number;
  initialLoadError: string | null;
  pageSize: number;
  initialHasMore: boolean;
};

export function CsiLandingClient({
  publication,
  initialPosts,
  initialTags,
  members,
  viewerRole,
  reviewQueueCount,
  initialLoadError,
  pageSize,
  initialHasMore,
}: CsiLandingClientProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [allTags, setAllTags] = useState<string[]>(initialTags);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "trending" | "popular">(
    "latest",
  );

  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialHasMore);
    setAllTags(initialTags);
  }, [initialPosts, initialHasMore, initialTags]);

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadError(null);
    setLoadingMore(true);
    try {
      const next = await loadMorePublicationPostsAction(
        publication.slug,
        pageSize,
        posts.length,
      );
      setPosts((prev) => [...prev, ...next]);
      setHasMore(next.length === pageSize);
    } catch (error) {
      console.error("Error loading more CSI posts:", error);
      setLoadError(
        "We couldn't load more articles right now. Check your connection and try again.",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, pageSize, posts.length, publication.slug]);

  const isFiltering = Boolean(searchTerm.trim() || selectedTag);

  const featuredPost = useMemo(() => {
    if (isFiltering || sortBy !== "latest" || posts.length === 0) return null;
    return posts[0];
  }, [isFiltering, sortBy, posts]);

  const filteredPosts = useMemo(() => {
    let list: PostWithAuthor[] = [...posts];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        (post) =>
          post.title.toLowerCase().includes(lower) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(lower)) ||
          post.author.full_name?.toLowerCase().includes(lower) ||
          post.author.username.toLowerCase().includes(lower),
      );
    }

    if (selectedTag) {
      list = list.filter((post) => post.tags?.includes(selectedTag));
    }

    switch (sortBy) {
      case "trending":
        list.sort(
          (a, b) =>
            (b.likes?.[0]?.count || 0) +
            (b.comments?.[0]?.count || 0) -
            ((a.likes?.[0]?.count || 0) + (a.comments?.[0]?.count || 0)),
        );
        break;
      case "popular":
        list.sort(
          (a, b) => (b.likes?.[0]?.count || 0) - (a.likes?.[0]?.count || 0),
        );
        break;
      case "latest":
      default:
        list.sort(
          (a, b) =>
            new Date(b.published_at || b.created_at).getTime() -
            new Date(a.published_at || a.created_at).getTime(),
        );
        break;
    }

    if (featuredPost) {
      return list.filter((p) => p.id !== featuredPost.id);
    }

    return list;
  }, [posts, searchTerm, selectedTag, sortBy, featuredPost]);

  const canPaginateServer = !isFiltering;

  return (
    <PageShell variant="wide">
      <LazyMotion features={domAnimation}>
        {loadError && (
          <Alert variant="destructive" className="mb-6 rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {/* Hero Section */}
        <m.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: motionEase }}
          className="relative mb-10 overflow-hidden rounded-3xl border-2 border-border/70 p-6 sm:p-10 md:p-12 glass"
        >
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 font-sans text-xs font-semibold tracking-wide text-primary">
              <Terminal className="h-3.5 w-3.5" />
              <span>Written by CSI technical members</span>
            </div>

            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-4 leading-tight">
              CSI <span className="gradient-text">Tech Blog</span>
            </h1>

            <p className="font-serif text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              {publication.description ||
                "Technical deep-dives, tutorials, and engineering explainers written by CSI MIT-WPU technical members."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {viewerRole && (
                <Button asChild size="lg" className="rounded-full shadow-md">
                  <Link href="/csi/write">
                    <PenTool className="mr-2 h-4 w-4" />
                    Write for CSI
                  </Link>
                </Button>
              )}

              {viewerRole === "editor" && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-primary/40"
                >
                  <Link href="/csi/review">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Review Queue
                    {reviewQueueCount > 0 && (
                      <Badge
                        variant="default"
                        className="ml-2 rounded-full px-2 py-0 text-xs"
                      >
                        {reviewQueueCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
              )}

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-full font-sans text-xs text-muted-foreground hover:text-foreground"
              >
                <a
                  href="/csi/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Rss className="mr-1.5 h-3.5 w-3.5" />
                  RSS Feed
                </a>
              </Button>
            </div>
          </div>
        </m.section>

        {/* Featured Post Spotlight */}
        {featuredPost && (
          <m.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.45, ease: motionEase }}
            aria-label="Featured CSI article"
            className="mb-10"
          >
            <Link href={`/csi/${featuredPost.slug}`} className="block group">
              <Card className="overflow-hidden border-2 transition-all duration-500 glass hover:border-primary/35 hover:shadow-2xl hover:shadow-primary/10">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {featuredPost.cover_image ? (
                    <div className="relative aspect-video lg:col-span-7 lg:aspect-auto lg:min-h-[22rem] overflow-hidden bg-muted/30">
                      <Image
                        src={featuredPost.cover_image}
                        alt={featuredPost.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 58vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="hidden lg:flex lg:col-span-5 items-center justify-center bg-gradient-to-br from-primary/15 via-muted/40 to-transparent p-10">
                      <Terminal className="h-20 w-20 text-primary/35" />
                    </div>
                  )}

                  <CardContent
                    className={`flex flex-col justify-between p-6 sm:p-8 lg:p-10 ${
                      featuredPost.cover_image
                        ? "lg:col-span-5"
                        : "lg:col-span-7"
                    }`}
                  >
                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <Badge className="gap-1 rounded-full px-3 py-0.5 font-sans text-xs">
                          <Sparkles className="h-3 w-3" />
                          Featured Post
                        </Badge>
                        {featuredPost.tags?.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="font-sans text-xs"
                          >
                            {toTitleCase(tag)}
                          </Badge>
                        ))}
                      </div>

                      <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors mb-3 leading-snug">
                        {featuredPost.title}
                      </h2>

                      {featuredPost.excerpt && (
                        <p className="font-serif text-base text-muted-foreground line-clamp-3 mb-6">
                          {featuredPost.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-primary/15">
                            <AvatarImage
                              src={featuredPost.author.avatar_url || ""}
                            />
                            <AvatarFallback>
                              {featuredPost.author.full_name?.[0] ||
                                featuredPost.author.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-sans text-sm font-semibold text-foreground">
                              {featuredPost.author.full_name ||
                                featuredPost.author.username}
                            </p>
                            <p className="font-sans text-xs text-muted-foreground">
                              @{featuredPost.author.username}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 font-sans text-xs font-medium text-primary group-hover:translate-x-1 transition-transform">
                          Read article
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-sans text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {featuredPost.read_time}m read
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {featuredPost.likes?.[0]?.count || 0}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {featuredPost.comments?.[0]?.count || 0}
                          </span>
                        </div>
                        <span>
                          {featuredPost.published_at
                            ? formatRelativeTime(featuredPost.published_at)
                            : ""}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </m.section>
        )}

        {/* Search, Sort & Tag Filter Chips */}
        <m.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: motionEase }}
          aria-label="Filter CSI posts"
          className="mb-8"
        >
          <Card className="glass border-2 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search technical posts, authors, or topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-10 text-base border-2 focus:border-primary/50 transition-all"
                  />
                </div>

                <Tabs
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as typeof sortBy)}
                  className="w-full lg:w-auto"
                >
                  <TabsList className="grid h-10 w-full grid-cols-3 lg:w-auto">
                    <TabsTrigger
                      value="latest"
                      className="flex items-center space-x-2"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Latest</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="trending"
                      className="flex items-center space-x-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Trending</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="popular"
                      className="flex items-center space-x-2"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Popular</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {allTags.length > 0 && (
                <div className="mt-5">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={selectedTag === "" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTag("")}
                      className="rounded-full transition-all"
                    >
                      All Topics
                    </Button>
                    {allTags.slice(0, 12).map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={selectedTag === tag ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setSelectedTag(selectedTag === tag ? "" : tag)
                        }
                        className="rounded-full transition-all"
                      >
                        {toTitleCase(tag)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </m.section>

        {/* Latest Posts Feed */}
        <m.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.14, duration: 0.4, ease: motionEase }}
          aria-label="CSI technical articles"
          className="mb-14"
        >
          {posts.length === 0 ? (
            <Card className="glass border-2 border-dashed py-16 text-center">
              <CardContent className="mx-auto max-w-md space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Terminal className="h-7 w-7 text-muted-foreground" />
                </div>
                <h2 className="font-display text-2xl font-semibold">
                  No CSI articles published yet
                </h2>
                <p className="font-sans text-sm text-muted-foreground">
                  Technical articles from CSI MIT-WPU members will appear here
                  as soon as editors approve the first submissions.
                </p>
                {viewerRole && (
                  <Button asChild className="rounded-full">
                    <Link href="/csi/write">
                      <PenTool className="mr-2 h-4 w-4" />
                      Write the first CSI post
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : filteredPosts.length === 0 && !featuredPost ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No matching articles
              </h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search query or clearing the topic filter.
              </p>
            </div>
          ) : (
            filteredPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post, index) => (
                  <m.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.06, 0.3) }}
                  >
                    <Link href={`/csi/${post.slug}`} className="block h-full">
                      <Card className="group flex h-full flex-col overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 glass border-2 hover:border-primary/30 hover:-translate-y-1.5 cursor-pointer">
                        {post.cover_image && (
                          <div className="aspect-video overflow-hidden relative bg-muted/30">
                            <Image
                              src={post.cover_image}
                              alt={post.title}
                              width={640}
                              height={360}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        )}
                        <CardContent className="p-6 flex flex-col flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                            <Avatar className="h-9 w-9 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                              <AvatarImage
                                src={post.author.avatar_url || ""}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xs">
                                {post.author.full_name?.[0] ||
                                  post.author.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-sans font-semibold text-sm truncate">
                                {post.author.full_name || post.author.username}
                              </p>
                              <p className="font-sans text-xs text-muted-foreground truncate">
                                @{post.author.username}
                              </p>
                            </div>
                          </div>

                          <h3 className="font-display font-semibold text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                            {post.title}
                          </h3>

                          <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                            {post.excerpt}
                          </p>

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="font-sans text-xs"
                                >
                                  {toTitleCase(tag)}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between font-sans text-xs text-muted-foreground mt-auto pt-4 border-t border-primary/10">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{post.read_time}m read</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Heart className="w-3.5 h-3.5" />
                                <span>{post.likes?.[0]?.count || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{post.comments?.[0]?.count || 0}</span>
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
                  </m.div>
                ))}
              </div>
            )
          )}

          {posts.length > 0 && canPaginateServer && hasMore && (
            <div className="mt-8 text-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-full"
                disabled={loadingMore}
                onClick={() => void loadMorePosts()}
              >
                {loadingMore ? "Loading..." : "Load More Posts"}
              </Button>
            </div>
          )}
        </m.section>

        {/* Our Writers Strip */}
        <m.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45, ease: motionEase }}
          aria-labelledby="csi-writers-heading"
          className="border-t border-border/60 pt-10 pb-4"
        >
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                <Users className="h-4 w-4" />
                <span>Contributors</span>
              </div>
              <h2
                id="csi-writers-heading"
                className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground"
              >
                Our Writers &amp; Editors
              </h2>
            </div>
            <p className="font-sans text-sm text-muted-foreground max-w-md">
              Meet the CSI MIT-WPU technical leads, secretaries, and members
              contributing tutorials and research notes.
            </p>
          </div>

          {members.length === 0 ? (
            <Card className="glass border border-border/60 p-6 text-center">
              <p className="font-sans text-sm text-muted-foreground">
                CSI technical members will be listed here once added by
                administrators.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {members.map((member) => (
                <Link
                  key={member.user_id}
                  href={`/profile/${member.profile.username}`}
                  className="block group"
                >
                  <Card className="h-full glass border border-border/70 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35">
                    <CardContent className="p-4 flex items-start gap-3.5">
                      <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/15 group-hover:ring-primary/35 transition-all">
                        <AvatarImage
                          src={member.profile.avatar_url || ""}
                        />
                        <AvatarFallback className="font-semibold">
                          {member.profile.full_name?.[0] ||
                            member.profile.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="truncate font-sans text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {member.profile.full_name ||
                              member.profile.username}
                          </p>
                        </div>
                        <p className="truncate font-sans text-xs text-muted-foreground">
                          @{member.profile.username}
                        </p>
                        <Badge
                          variant={
                            member.role === "editor" ? "default" : "secondary"
                          }
                          className="mt-2 font-sans text-[10px] px-2 py-0 h-5"
                        >
                          {member.role === "editor"
                            ? "Editor"
                            : "Technical Member"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </m.section>
      </LazyMotion>
    </PageShell>
  );
}
