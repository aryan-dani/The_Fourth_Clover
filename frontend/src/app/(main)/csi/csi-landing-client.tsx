"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/features/auth/auth-context";
import { motionEase } from "@/lib/motion";
import {
  formatRelativeTime,
  toTitleCase,
  getCurrentWeekKey,
  formatLinkedinRepostCopy,
} from "@/lib/utils";
import {
  loadMorePublicationPostsAction,
  joinPublicationAsWriterAction,
  selectWeeklyLinkedinPickAction,
  approvePublicationPostAction,
} from "@/features/data/server-actions";
import { toast } from "sonner";
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
  Users,
  ArrowRight,
  Terminal,
  Linkedin,
  Copy,
  CheckCircle2,
  UserPlus,
  Loader2,
  Award,
} from "lucide-react";

type CsiLandingClientProps = {
  publication: Publication;
  initialPosts: PostWithAuthor[];
  initialSubmissions?: PostWithAuthor[];
  initialWeeklyPick?: PostWithAuthor | null;
  initialTags: string[];
  members: PublicationMemberWithProfile[];
  viewerRole?: PublicationRole | null;
  reviewQueueCount?: number;
  initialLoadError: string | null;
  pageSize: number;
  initialHasMore: boolean;
};

export function CsiLandingClient({
  publication,
  initialPosts,
  initialSubmissions = [],
  initialWeeklyPick = null,
  initialTags,
  members: initialMembers,
  viewerRole: serverViewerRole = null,
  initialLoadError,
  pageSize,
  initialHasMore,
}: CsiLandingClientProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [submissions, setSubmissions] =
    useState<PostWithAuthor[]>(initialSubmissions);
  const [weeklyPick, setWeeklyPick] = useState<PostWithAuthor | null>(
    initialWeeklyPick,
  );
  const [members, setMembers] =
    useState<PublicationMemberWithProfile[]>(initialMembers);
  const [joinedRole, setJoinedRole] = useState<PublicationRole | null>(null);
  const [allTags, setAllTags] = useState<string[]>(initialTags);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [feedMode, setFeedMode] = useState<"all" | "submissions" | "published">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"latest" | "trending" | "popular">(
    "latest",
  );
  const [isPending, startTransition] = useTransition();
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  const currentWeekKey = useMemo(() => getCurrentWeekKey(), []);

  useEffect(() => {
    setPosts(initialPosts);
    setSubmissions(initialSubmissions);
    setWeeklyPick(initialWeeklyPick);
    setMembers(initialMembers);
    setHasMore(initialHasMore);
    setAllTags(initialTags);
  }, [
    initialPosts,
    initialSubmissions,
    initialWeeklyPick,
    initialMembers,
    initialHasMore,
    initialTags,
  ]);

  const isSuperAdmin = Boolean(profile?.is_admin);

  const viewerRole: PublicationRole | null = useMemo(() => {
    if (isSuperAdmin) return "editor";
    if (joinedRole) return joinedRole;
    if (serverViewerRole) return serverViewerRole;
    if (!user?.id) return null;
    const found = members.find((m) => m.user_id === user.id);
    return found?.role ?? null;
  }, [isSuperAdmin, joinedRole, serverViewerRole, user?.id, members]);

  const reviewQueueCount = submissions.length;

  const handleJoinCsi = () => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    startTransition(async () => {
      const res = await joinPublicationAsWriterAction(publication.slug);
      if (!res.ok) {
        toast.error(res.error || "Could not join CSI writers.");
        return;
      }
      setJoinedRole("writer");
      toast.success(
        "Welcome to the CSI Technical Blog! You can now post your Sunday-to-Wednesday articles.",
      );
      router.refresh();
    });
  };

  const handleSelectWeeklyPick = (post: PostWithAuthor) => {
    setBusyPostId(post.id);
    startTransition(async () => {
      const res = await selectWeeklyLinkedinPickAction(post.id);
      setBusyPostId(null);
      if (!res.ok) {
        toast.error(res.error || "Could not select Weekly LinkedIn Pick.");
        return;
      }
      const updatedPost: PostWithAuthor = {
        ...post,
        status: "published",
        published_at: post.published_at ?? new Date().toISOString(),
        linkedin_pick_week: res.weekKey ?? currentWeekKey,
      };
      setWeeklyPick(updatedPost);
      setSubmissions((prev) => prev.filter((p) => p.id !== post.id));
      setPosts((prev) => {
        const exists = prev.some((p) => p.id === post.id);
        const cleared = isSuperAdmin
          ? prev.map((p) =>
              p.linkedin_pick_week === (res.weekKey ?? currentWeekKey)
                ? { ...p, linkedin_pick_week: null }
                : p,
            )
          : prev;
        return exists
          ? cleared.map((p) => (p.id === post.id ? updatedPost : p))
          : [updatedPost, ...cleared];
      });
      toast.success(
        `Selected "${post.title}" as the official CSI LinkedIn post for ${res.weekKey || currentWeekKey}!`,
      );
      router.refresh();
    });
  };

  const handleQuickApprove = (post: PostWithAuthor) => {
    setBusyPostId(post.id);
    startTransition(async () => {
      const res = await approvePublicationPostAction(post.id);
      setBusyPostId(null);
      if (!res.ok) {
        toast.error(res.error || "Could not approve post.");
        return;
      }
      const updatedPost: PostWithAuthor = {
        ...post,
        status: "published",
        published_at: post.published_at ?? new Date().toISOString(),
      };
      setSubmissions((prev) => prev.filter((p) => p.id !== post.id));
      setPosts((prev) => [updatedPost, ...prev]);
      toast.success(`Published "${post.title}" to CSI Tech Blog!`);
      router.refresh();
    });
  };

  const handleCopyLinkedinText = (post: PostWithAuthor) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/csi/${post.slug}`
        : `/csi/${post.slug}`;
    const copy = formatLinkedinRepostCopy({
      title: post.title,
      authorName: post.author.full_name || post.author.username,
      excerpt: post.excerpt,
      tags: post.tags,
      url,
      weekKey: post.linkedin_pick_week || currentWeekKey,
    });
    navigator.clipboard.writeText(copy);
    toast.success("Copied LinkedIn repost caption to clipboard!");
  };

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

  const activeSourcePosts = useMemo(() => {
    if (feedMode === "submissions") return submissions;
    if (feedMode === "published") return posts;
    const seen = new Set<string>();
    const merged: PostWithAuthor[] = [];
    for (const item of [...submissions, ...posts]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged;
  }, [feedMode, submissions, posts]);

  const isFiltering = Boolean(searchTerm.trim() || selectedTag);

  const featuredPost = useMemo(() => {
    if (weeklyPick && !isFiltering && feedMode !== "submissions") {
      return weeklyPick;
    }
    if (isFiltering || sortBy !== "latest" || posts.length === 0) return null;
    return posts[0];
  }, [weeklyPick, isFiltering, feedMode, sortBy, posts]);

  const filteredPosts = useMemo(() => {
    let list: PostWithAuthor[] = [...activeSourcePosts];

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
            new Date(b.published_at || b.updated_at || b.created_at).getTime() -
            new Date(a.published_at || a.updated_at || a.created_at).getTime(),
        );
        break;
    }

    if (featuredPost && feedMode !== "submissions") {
      return list.filter((p) => p.id !== featuredPost.id);
    }

    return list;
  }, [
    activeSourcePosts,
    searchTerm,
    selectedTag,
    sortBy,
    featuredPost,
    feedMode,
  ]);

  const canPaginateServer = !isFiltering && feedMode !== "submissions";

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
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: motionEase }}
          className="border-border/70 glass relative mb-8 overflow-hidden rounded-3xl border-2 p-6 sm:p-10 md:p-12"
        >
          <div className="mx-auto max-w-3xl text-center">
            <div className="border-primary/25 bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-sans text-xs font-semibold tracking-wide">
              <Terminal className="h-3.5 w-3.5" />
              <span>Written by CSI MIT-WPU technical members</span>
            </div>

            <h1 className="font-display text-foreground mb-4 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              CSI <span className="gradient-text">Tech Blog</span>
            </h1>

            <p className="text-muted-foreground mx-auto mb-6 max-w-2xl font-serif text-lg leading-relaxed md:text-xl">
              {publication.description ||
                "Technical deep-dives, tutorials, and engineering explainers written by CSI MIT-WPU technical members."}
            </p>

            {/* Weekly Cycle Pill */}
            <div className="border-border/60 bg-background/60 mx-auto mb-8 flex max-w-2xl flex-wrap items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-xs sm:text-sm">
              <Badge
                variant="secondary"
                className="bg-primary/15 text-primary rounded-full font-semibold"
              >
                Cycle {currentWeekKey}
              </Badge>
              <span className="text-muted-foreground">
                <strong>Sun - Wed:</strong> Members post & review each
                other&apos;s drafts
              </span>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="text-foreground font-medium">
                <strong>Wednesday AM:</strong> 1 post chosen for official CSI
                LinkedIn repost
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {viewerRole ? (
                <Button asChild size="lg" className="rounded-full shadow-md">
                  <Link href="/csi/write">
                    <PenTool className="mr-2 h-4 w-4" />
                    Post Weekly Article
                  </Link>
                </Button>
              ) : user ? (
                <Button
                  type="button"
                  size="lg"
                  disabled={isPending}
                  onClick={handleJoinCsi}
                  className="rounded-full shadow-md"
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Join as CSI Technical Member
                </Button>
              ) : (
                <Button asChild size="lg" className="rounded-full shadow-md">
                  <Link href="/auth/signup">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create CSI Member ID
                  </Link>
                </Button>
              )}

              {viewerRole === "editor" && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-primary/40 rounded-full"
                >
                  <Link href="/csi/review">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Wednesday Review Queue
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
                className="text-muted-foreground hover:text-foreground rounded-full"
              >
                <a
                  href="/csi/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Rss className="mr-1.5 h-4 w-4" />
                  RSS Feed
                </a>
              </Button>
            </div>
          </div>
        </m.section>

        {/* Featured / Weekly LinkedIn Pick Post */}
        {featuredPost && (
          <m.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: motionEase }}
            className="mb-10"
          >
            <Card className="border-primary/35 glass group overflow-hidden rounded-3xl border-2 transition-all duration-300 hover:shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {featuredPost.cover_image && (
                  <Link
                    href={`/csi/${featuredPost.slug}`}
                    className="bg-muted/30 relative aspect-[16/10] overflow-hidden lg:col-span-6 lg:aspect-auto lg:min-h-[320px]"
                  >
                    <Image
                      src={featuredPost.cover_image}
                      alt={featuredPost.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </Link>
                )}

                <CardContent
                  className={`flex flex-col justify-center p-6 sm:p-8 lg:p-10 ${
                    featuredPost.cover_image
                      ? "lg:col-span-6"
                      : "lg:col-span-12"
                  }`}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {featuredPost.linkedin_pick_week ? (
                      <Badge className="gap-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-600">
                        <Linkedin className="h-3 w-3" />
                        Official CSI LinkedIn Pick (
                        {featuredPost.linkedin_pick_week})
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="gap-1 rounded-full text-xs"
                      >
                        <Award className="h-3 w-3" />
                        Featured Technical Post
                      </Badge>
                    )}
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {featuredPost.read_time} min read
                    </span>
                  </div>

                  <Link href={`/csi/${featuredPost.slug}`}>
                    <h2 className="font-display group-hover:text-primary mb-3 text-2xl leading-snug font-semibold tracking-tight transition-colors sm:text-3xl">
                      {featuredPost.title}
                    </h2>
                  </Link>

                  {featuredPost.excerpt && (
                    <p className="text-muted-foreground mb-5 line-clamp-3 font-serif text-base leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                  )}

                  {featuredPost.tags && featuredPost.tags.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-1.5">
                      {featuredPost.tags.slice(0, 4).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer rounded-full text-xs"
                          onClick={() => setSelectedTag(tag)}
                        >
                          {toTitleCase(tag)}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="border-border/50 mt-auto flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                    <Link
                      href={`/profile/${featuredPost.author.username}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="ring-border h-9 w-9 ring-1">
                        <AvatarImage
                          src={featuredPost.author.avatar_url || ""}
                        />
                        <AvatarFallback>
                          {featuredPost.author.full_name?.[0] ||
                            featuredPost.author.username?.[0] ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {featuredPost.author.full_name ||
                            featuredPost.author.username}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatRelativeTime(
                            featuredPost.published_at ||
                              featuredPost.created_at,
                          )}
                        </p>
                      </div>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                      {(viewerRole === "editor" ||
                        Boolean(featuredPost.linkedin_pick_week)) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLinkedinText(featuredPost)}
                          className="gap-1.5 rounded-full text-xs"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy LinkedIn Post
                        </Button>
                      )}
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="group/btn gap-1.5 rounded-full"
                      >
                        <Link href={`/csi/${featuredPost.slug}`}>
                          Read article
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </m.section>
        )}

        {/* Feed Mode + Search + Filter Bar */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: motionEase }}
          className="mb-8 space-y-5"
        >
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <Tabs
              value={feedMode}
              onValueChange={(value) =>
                setFeedMode(value as "all" | "submissions" | "published")
              }
              className="w-full lg:w-auto"
            >
              <TabsList className="bg-muted/60 grid h-11 w-full grid-cols-3 rounded-2xl p-1 lg:w-auto">
                <TabsTrigger value="all" className="rounded-xl text-xs sm:text-sm">
                  All CSI ({posts.length + submissions.length})
                </TabsTrigger>
                <TabsTrigger
                  value="submissions"
                  className="gap-1.5 rounded-xl text-xs sm:text-sm"
                >
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Sun-Wed Submissions ({submissions.length})
                </TabsTrigger>
                <TabsTrigger
                  value="published"
                  className="rounded-xl text-xs sm:text-sm"
                >
                  Published ({posts.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[240px] flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search CSI articles, topics, or members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-border/80 bg-card/85 h-11 rounded-2xl pl-10"
                />
              </div>

              <Tabs
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(value as "latest" | "trending" | "popular")
                }
                className="w-full sm:w-auto"
              >
                <TabsList className="grid h-11 w-full grid-cols-3 rounded-2xl sm:w-[270px]">
                  <TabsTrigger value="latest" className="gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    Latest
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="gap-1 text-xs">
                    <Heart className="h-3 w-3" />
                    Popular
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground mr-1 text-xs font-medium tracking-wider uppercase">
                Topics:
              </span>
              <Badge
                variant={selectedTag === "" ? "default" : "outline"}
                className="cursor-pointer rounded-full transition-colors"
                onClick={() => setSelectedTag("")}
              >
                All
              </Badge>
              {allTags.slice(0, 14).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="hover:bg-primary hover:text-primary-foreground cursor-pointer rounded-full transition-colors"
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? "" : tag)
                  }
                >
                  {toTitleCase(tag)}
                </Badge>
              ))}
            </div>
          )}
        </m.div>

        {/* Posts Grid */}
        <m.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35, ease: motionEase }}
          className="mb-14"
        >
          {filteredPosts.length === 0 ? (
            <Card className="border-border/70 glass rounded-3xl border-2 text-center">
              <CardContent className="p-10 sm:p-12">
                <Search className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-60" />
                <h2 className="font-display mb-2 text-xl font-semibold">
                  {isFiltering
                    ? "No matching CSI articles"
                    : feedMode === "submissions"
                      ? "No Sunday-to-Wednesday submissions waiting right now"
                      : "No CSI posts published yet"}
                </h2>
                <p className="text-muted-foreground mx-auto mb-6 max-w-md text-sm">
                  {isFiltering
                    ? "Try clearing your search or topic filter to see more articles from CSI technical members."
                    : "CSI technical members can submit their weekly articles between Sunday and Wednesday to interact with peers and compete for the Wednesday LinkedIn spotlight."}
                </p>
                {isFiltering ? (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTag("");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : viewerRole ? (
                  <Button asChild className="rounded-full">
                    <Link href="/csi/write">
                      <PenTool className="mr-2 h-4 w-4" />
                      Write the first article for {currentWeekKey}
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post, index) => {
                const isBusy = isPending && busyPostId === post.id;
                const isWeeklyWinner =
                  post.linkedin_pick_week === currentWeekKey;

                return (
                  <m.div
                    key={post.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(index * 0.03, 0.25),
                      duration: 0.3,
                      ease: motionEase,
                    }}
                  >
                    <Card className="border-border/70 glass group flex h-full flex-col overflow-hidden rounded-3xl border-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                      {post.cover_image && (
                        <Link
                          href={`/csi/${post.slug}`}
                          className="bg-muted/30 relative aspect-video w-full overflow-hidden"
                        >
                          <Image
                            src={post.cover_image}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </Link>
                      )}

                      <CardContent className="flex flex-1 flex-col p-6">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {post.linkedin_pick_week ? (
                              <Badge className="gap-1 rounded-full bg-blue-600 text-[10px] text-white hover:bg-blue-600">
                                <Linkedin className="h-2.5 w-2.5" />
                                LinkedIn Pick ({post.linkedin_pick_week})
                              </Badge>
                            ) : post.status === "in_review" ? (
                              <Badge
                                variant="outline"
                                className="rounded-full border-amber-500/40 bg-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-300"
                              >
                                Sun-Wed Submission
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-primary/12 text-primary border-primary/20 rounded-full text-[11px]"
                              >
                                CSI
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {post.read_time}m read
                          </span>
                        </div>

                        <Link href={`/csi/${post.slug}`} className="group/link">
                          <h3 className="font-display group-hover/link:text-primary mb-2 line-clamp-2 text-lg leading-snug font-semibold transition-colors">
                            {post.title}
                          </h3>
                        </Link>

                        {post.excerpt && (
                          <p className="text-muted-foreground mb-4 line-clamp-3 flex-1 font-serif text-sm leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}

                        {post.tags && post.tags.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="cursor-pointer rounded-full text-xs"
                                onClick={() => setSelectedTag(tag)}
                              >
                                {toTitleCase(tag)}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Technical Head (Darshan/Tanish) & Super Admin (Aryan) Weekly Selection Controls */}
                        {viewerRole === "editor" && (
                          <div className="border-border/50 bg-muted/30 mb-4 flex flex-wrap items-center gap-1.5 rounded-2xl border p-2">
                            {post.status === "in_review" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={isBusy}
                                onClick={() => handleQuickApprove(post)}
                                className="h-7 gap-1 rounded-full px-2.5 text-[11px]"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Approve
                              </Button>
                            )}
                            {!isWeeklyWinner && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => handleSelectWeeklyPick(post)}
                                className="h-7 gap-1 rounded-full border-blue-500/40 px-2.5 text-[11px] text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
                              >
                                {isBusy ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Award className="h-3 w-3" />
                                )}
                                Pick for Wed LinkedIn
                              </Button>
                            )}
                            {post.linkedin_pick_week && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyLinkedinText(post)}
                                className="h-7 gap-1 rounded-full px-2.5 text-[11px]"
                              >
                                <Copy className="h-3 w-3" />
                                Copy LinkedIn
                              </Button>
                            )}
                          </div>
                        )}

                        <div className="border-border/50 mt-auto flex items-center justify-between border-t pt-4">
                          <Link
                            href={`/profile/${post.author.username}`}
                            className="flex min-w-0 items-center gap-2"
                          >
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage
                                src={post.author.avatar_url || ""}
                              />
                              <AvatarFallback className="text-xs">
                                {post.author.full_name?.[0] ||
                                  post.author.username?.[0] ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground hover:text-foreground truncate text-xs transition-colors">
                              {post.author.full_name || post.author.username}
                            </span>
                          </Link>

                          <div className="text-muted-foreground flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.likes?.[0]?.count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {post.comments?.[0]?.count || 0}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </m.div>
                );
              })}
            </div>
          )}

          {canPaginateServer && hasMore && filteredPosts.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                disabled={loadingMore}
                onClick={() => void loadMorePosts()}
              >
                {loadingMore ? "Loading..." : "Load more articles"}
              </Button>
            </div>
          )}
        </m.section>

        {/* Our Writers Strip */}
        <m.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35, ease: motionEase }}
          className="mb-8"
        >
          <Card className="border-border/70 glass rounded-3xl border-2">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary/12 text-primary flex h-9 w-9 items-center justify-center rounded-full">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold tracking-tight">
                      Our Writers & Technical Heads
                    </h2>
                    <p className="text-muted-foreground text-xs">
                      CSI MIT-WPU technical leads, secretaries, and contributors
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit rounded-full">
                  {members.length}{" "}
                  {members.length === 1 ? "Member" : "Members"}
                </Badge>
              </div>

              {members.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  CSI contributor profiles will appear here once members join.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {members.map((member) => (
                    <Link
                      key={member.user_id}
                      href={`/profile/${member.profile.username}`}
                      className="border-border/60 bg-card/60 hover:border-primary/40 hover:bg-muted/50 flex items-center gap-3 rounded-2xl border p-3 transition-all"
                    >
                      <Avatar className="ring-border h-10 w-10 shrink-0 ring-1">
                        <AvatarImage src={member.profile.avatar_url || ""} />
                        <AvatarFallback>
                          {member.profile.full_name?.[0] ||
                            member.profile.username?.[0] ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">
                            {member.profile.full_name ||
                              member.profile.username}
                          </p>
                          <Badge
                            variant={
                              member.role === "editor" ? "default" : "secondary"
                            }
                            className="shrink-0 rounded-full px-2 py-0 text-[10px] capitalize"
                          >
                            {member.role === "editor" ? "Lead" : "Writer"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground truncate text-xs">
                          @{member.profile.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </m.section>
      </LazyMotion>
    </PageShell>
  );
}
