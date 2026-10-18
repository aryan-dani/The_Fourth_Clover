"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  CheckCircle2,
  MessageSquareWarning,
  Eye,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  Award,
  Copy,
  Check,
  Trash2,
  PenSquare,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import {
  approvePublicationPostAction,
  requestPublicationChangesAction,
  selectWeeklyLinkedinPickAction,
  clearWeeklyLinkedinPickAction,
  superAdminDeletePostAction,
} from "@/features/data/server-actions";
import {
  formatDate,
  getCurrentWeekKey,
  formatLinkedinRepostCopy,
} from "@/lib/utils";
import { toast } from "sonner";
import type { PostWithAuthor } from "@/types/database";

type CsiReviewClientProps = {
  initialPosts: PostWithAuthor[];
  initialPublishedPosts: PostWithAuthor[];
  isSuperAdmin: boolean;
  publicationName: string;
};

export function CsiReviewClient({
  initialPosts,
  initialPublishedPosts,
  isSuperAdmin,
  publicationName,
}: CsiReviewClientProps) {
  const router = useRouter();
  const currentWeekKey = getCurrentWeekKey();
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [publishedPosts, setPublishedPosts] = useState<PostWithAuthor[]>(
    initialPublishedPosts,
  );
  const [activeTab, setActiveTab] = useState<"queue" | "published">("queue");
  const [expandedId, setExpandedId] = useState<string | null>(
    initialPosts[0]?.id ?? null,
  );
  const [feedbackPost, setFeedbackPost] = useState<PostWithAuthor | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentWeeklyPick =
    publishedPosts.find((p) => p.linkedin_pick_week === currentWeekKey) ||
    posts.find((p) => p.linkedin_pick_week === currentWeekKey) ||
    null;

  const isWeekLockedForLead = Boolean(currentWeeklyPick) && !isSuperAdmin;

  const handleCopyLinkedin = async (post: PostWithAuthor) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://thefourthclover.tech";
    const postUrl = `${origin}/csi/${post.slug}`;
    const authorName =
      post.author?.full_name || post.author?.username || "CSI Technical Member";
    const text = formatLinkedinRepostCopy({
      title: post.title,
      authorName,
      excerpt: post.excerpt,
      url: postUrl,
      tags: post.tags,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(post.id);
      toast.success("Copied CSI LinkedIn repost caption to clipboard!");
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const handleApprove = (post: PostWithAuthor) => {
    setActivePostId(post.id);
    startTransition(async () => {
      const result = await approvePublicationPostAction(post.id);
      setActivePostId(null);

      if (!result.ok) {
        toast.error(result.error || "Failed to approve post.");
        return;
      }

      const updatedPost: PostWithAuthor = {
        ...post,
        status: "published",
        published_at: new Date().toISOString(),
      };
      setPosts((prev) => prev.filter((item) => item.id !== post.id));
      setPublishedPosts((prev) => [
        updatedPost,
        ...prev.filter((item) => item.id !== post.id),
      ]);
      toast.success(`Published "${post.title}" to CSI Tech Blog!`);
      router.refresh();
    });
  };

  const handleSelectLinkedinPick = (post: PostWithAuthor) => {
    setActivePostId(post.id);
    startTransition(async () => {
      const result = await selectWeeklyLinkedinPickAction(
        post.id,
        currentWeekKey,
      );
      setActivePostId(null);

      if (!result.ok) {
        toast.error(
          result.error || "Failed to select Wednesday LinkedIn post.",
        );
        return;
      }

      const promoted: PostWithAuthor = {
        ...post,
        status: "published",
        published_at: post.published_at || new Date().toISOString(),
        linkedin_pick_week: result.weekKey || currentWeekKey,
      };

      setPosts((prev) => prev.filter((item) => item.id !== post.id));
      setPublishedPosts((prev) => {
        const cleared = prev.map((item) =>
          item.linkedin_pick_week === (result.weekKey || currentWeekKey)
            ? { ...item, linkedin_pick_week: null }
            : item,
        );
        const exists = cleared.some((item) => item.id === post.id);
        return exists
          ? cleared.map((item) => (item.id === post.id ? promoted : item))
          : [promoted, ...cleared];
      });

      toast.success(
        `Selected "${post.title}" as the official CSI LinkedIn post for ${result.weekKey || currentWeekKey}!`,
      );
      router.refresh();
    });
  };

  const handleClearLinkedinPick = (post: PostWithAuthor) => {
    setActivePostId(post.id);
    startTransition(async () => {
      const result = await clearWeeklyLinkedinPickAction(post.id);
      setActivePostId(null);

      if (!result.ok) {
        toast.error(result.error || "Failed to clear weekly LinkedIn pick.");
        return;
      }

      setPublishedPosts((prev) =>
        prev.map((item) =>
          item.id === post.id ? { ...item, linkedin_pick_week: null } : item,
        ),
      );
      toast.success(`Cleared Wednesday LinkedIn pick for ${currentWeekKey}.`);
      router.refresh();
    });
  };

  const handleSuperAdminDelete = (post: PostWithAuthor) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Super Admin: Permanently delete "${post.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setActivePostId(post.id);
    startTransition(async () => {
      const result = await superAdminDeletePostAction(post.id);
      setActivePostId(null);

      if (!result.ok) {
        toast.error(result.error || "Failed to delete post.");
        return;
      }

      setPosts((prev) => prev.filter((item) => item.id !== post.id));
      setPublishedPosts((prev) => prev.filter((item) => item.id !== post.id));
      toast.success(`Deleted "${post.title}".`);
      router.refresh();
    });
  };

  const handleRequestChangesSubmit = () => {
    if (!feedbackPost) return;
    const targetPost = feedbackPost;
    setActivePostId(targetPost.id);

    startTransition(async () => {
      const result = await requestPublicationChangesAction(
        targetPost.id,
        reviewNote.trim() || undefined,
      );
      setActivePostId(null);

      if (!result.ok) {
        toast.error(result.error || "Failed to return post to draft.");
        return;
      }

      setPosts((prev) => prev.filter((item) => item.id !== targetPost.id));
      setFeedbackPost(null);
      setReviewNote("");
      toast.success(`Returned "${targetPost.title}" to author with feedback.`);
      router.refresh();
    });
  };

  const displayedList = activeTab === "queue" ? posts : publishedPosts;

  return (
    <LazyMotion features={domAnimation}>
      <PageShell className="py-8">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/15 text-primary border-primary/30 rounded-full px-3 py-0.5 text-xs">
                  Editorial Queue & Wednesday Selection
                </Badge>
                {isSuperAdmin ? (
                  <Badge className="gap-1 rounded-full border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 text-xs text-emerald-600 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Super Admin (Unlimited Override)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="rounded-full px-3 py-0.5 text-xs"
                  >
                    CSI Technical Head (1 LinkedIn Pick / Week)
                  </Badge>
                )}
                <span className="text-muted-foreground text-xs">
                  {publicationName}
                </span>
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                CSI Review & LinkedIn Desk
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Technical members submit from Sunday to Wednesday. Approve articles for `/csi` and lock in the single Wednesday LinkedIn feature for CSI reposting.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 rounded-full"
              >
                <Link href="/csi">
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  CSI Feed
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-2 rounded-full">
                <Link href="/csi/write">Write Article</Link>
              </Button>
            </div>
          </div>

          {/* Wednesday LinkedIn Pick Status Card */}
          <Card className="glass-card border-primary/35 bg-primary/[0.04] mb-8 overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold">
                      <Award className="h-3.5 w-3.5" aria-hidden />
                      Wednesday LinkedIn Cycle: {currentWeekKey}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full text-xs font-medium"
                    >
                      {currentWeeklyPick
                        ? "1 / 1 Weekly Slot Filled"
                        : "0 / 1 Weekly Slot Open"}
                    </Badge>
                  </div>

                  {currentWeeklyPick ? (
                    <div>
                      <p className="font-display text-lg font-bold tracking-tight">
                        Selected:{" "}
                        <Link
                          href={`/csi/${currentWeeklyPick.slug}`}
                          className="hover:text-primary underline decoration-primary/40 underline-offset-4"
                        >
                          {currentWeeklyPick.title}
                        </Link>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        By{" "}
                        {currentWeeklyPick.author?.full_name ||
                          currentWeeklyPick.author?.username ||
                          "CSI Member"}{" "}
                        · Ready for official CSI LinkedIn repost
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No post has been locked in for{" "}
                      <span className="text-foreground font-semibold">
                        {currentWeekKey}
                      </span>{" "}
                      yet. Technical Heads (Darshan and Tanish) or Super Admin (Aryan) can select one post below to go live for Wednesday LinkedIn reposting.
                    </p>
                  )}
                </div>

                {currentWeeklyPick && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLinkedin(currentWeeklyPick)}
                      className="gap-1.5 rounded-full"
                    >
                      {copiedId === currentWeeklyPick.id ? (
                        <Check
                          className="h-4 w-4 text-emerald-500"
                          aria-hidden
                        />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden />
                      )}
                      {copiedId === currentWeeklyPick.id
                        ? "Copied LinkedIn Caption"
                        : "Copy LinkedIn Repost Text"}
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleClearLinkedinPick(currentWeeklyPick)}
                        className="gap-1.5 rounded-full text-amber-600 hover:bg-amber-500/10 dark:text-amber-300"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Clear Pick
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Queue vs Published Toggle */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("queue")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "queue"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Sunday-to-Wednesday Queue
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0 text-xs"
              >
                {posts.length}
              </Badge>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("published")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "published"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Published CSI Articles (Pick LinkedIn Feature)
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0 text-xs"
              >
                {publishedPosts.length}
              </Badge>
            </button>
          </div>

          {displayedList.length === 0 ? (
            <Card className="glass-card border-border/60">
              <CardContent className="p-12 text-center">
                <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Award className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="font-display mb-2 text-xl font-semibold">
                  {activeTab === "queue"
                    ? "All caught up on Sunday-to-Wednesday submissions!"
                    : "No published CSI articles yet"}
                </h2>
                <p className="text-muted-foreground mx-auto mb-6 max-w-md text-sm">
                  {activeTab === "queue"
                    ? "There are no pending articles in the CSI review queue right now. Switch to the Published tab to pick this week's Wednesday LinkedIn post."
                    : "Approve a submission from the queue or publish a new CSI technical article."}
                </p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/csi">Browse CSI Tech Blog</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {displayedList.map((post, index) => {
                const isExpanded = expandedId === post.id;
                const isBusy = isPending && activePostId === post.id;
                const isThisWeeksPick =
                  post.linkedin_pick_week === currentWeekKey;

                return (
                  <m.div
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.03 }}
                  >
                    <Card
                      className={`glass-card overflow-hidden transition-all ${
                        isThisWeeksPick
                          ? "border-primary/60 ring-primary/20 ring-2"
                          : "border-border/60"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={post.author?.avatar_url ?? undefined}
                                  alt={post.author?.full_name || "Author"}
                                />
                                <AvatarFallback className="text-xs font-semibold">
                                  {(
                                    post.author?.full_name ||
                                    post.author?.username ||
                                    "U"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-sm">
                                <span className="font-medium">
                                  {post.author?.full_name ||
                                    post.author?.username ||
                                    "Anonymous"}
                                </span>
                                {post.author?.username && (
                                  <span className="text-muted-foreground ml-1.5 text-xs">
                                    @{post.author.username}
                                  </span>
                                )}
                              </div>
                              <span className="text-muted-foreground text-xs">
                                · Updated {formatDate(post.updated_at)}
                              </span>
                              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                <Clock className="h-3.5 w-3.5" aria-hidden />
                                {post.read_time} min read
                              </span>
                              {isThisWeeksPick && (
                                <Badge className="bg-primary text-primary-foreground gap-1 rounded-full text-xs">
                                  <Award className="h-3 w-3" aria-hidden />
                                  Wednesday LinkedIn Pick ({currentWeekKey})
                                </Badge>
                              )}
                            </div>

                            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                              {post.title}
                            </h2>

                            {post.excerpt && (
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {post.excerpt}
                              </p>
                            )}

                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {post.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="rounded-full text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : post.id)
                              }
                              className="gap-1.5 rounded-full"
                            >
                              <Eye className="h-4 w-4" aria-hidden />
                              {isExpanded ? "Hide Body" : "Inspect Body"}
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                              )}
                            </Button>

                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 rounded-full"
                            >
                              <Link href={`/csi/${post.slug}`}>
                                Full Page
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                              </Link>
                            </Button>

                            {isSuperAdmin && (
                              <>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 rounded-full"
                                >
                                  <Link href={`/csi/write?edit=${post.id}`}>
                                    <PenSquare
                                      className="h-3.5 w-3.5"
                                      aria-hidden
                                    />
                                    Edit
                                  </Link>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => handleSuperAdminDelete(post)}
                                  className="gap-1.5 rounded-full border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                  Delete
                                </Button>
                              </>
                            )}

                            {activeTab === "queue" && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setFeedbackPost(post);
                                    setReviewNote(post.review_note || "");
                                  }}
                                  className="gap-1.5 rounded-full border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-300"
                                >
                                  <MessageSquareWarning
                                    className="h-4 w-4"
                                    aria-hidden
                                  />
                                  Request Changes
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  disabled={isBusy}
                                  onClick={() => handleApprove(post)}
                                  className="gap-1.5 rounded-full"
                                >
                                  {isBusy ? (
                                    <Loader2
                                      className="h-4 w-4 animate-spin"
                                      aria-hidden
                                    />
                                  ) : (
                                    <CheckCircle2
                                      className="h-4 w-4"
                                      aria-hidden
                                    />
                                  )}
                                  Approve & Publish
                                </Button>
                              </>
                            )}

                            {!isThisWeeksPick ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled={isBusy || isWeekLockedForLead}
                                onClick={() => handleSelectLinkedinPick(post)}
                                title={
                                  isWeekLockedForLead
                                    ? `1 post is already selected for ${currentWeekKey}. Only Super Admin can override.`
                                    : `Select as Wednesday LinkedIn Post (${currentWeekKey})`
                                }
                                className="gap-1.5 rounded-full"
                              >
                                {isBusy ? (
                                  <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden
                                  />
                                ) : (
                                  <Award className="h-4 w-4" aria-hidden />
                                )}
                                {currentWeeklyPick && isSuperAdmin
                                  ? "Override LinkedIn Pick"
                                  : "Pick for Wednesday LinkedIn"}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLinkedin(post)}
                                className="gap-1.5 rounded-full"
                              >
                                {copiedId === post.id ? (
                                  <Check
                                    className="h-4 w-4 text-emerald-500"
                                    aria-hidden
                                  />
                                ) : (
                                  <Copy className="h-4 w-4" aria-hidden />
                                )}
                                Copy LinkedIn Text
                              </Button>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-border/60 bg-background/50 mt-6 rounded-2xl border p-4 sm:p-6">
                            <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
                              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                Rendered Markdown Preview
                              </span>
                              <span className="text-muted-foreground font-mono text-xs">
                                /csi/{post.slug}
                              </span>
                            </div>
                            <PostBodyRenderer
                              content={post.content}
                              forceMarkdown={true}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </m.div>
                );
              })}
            </div>
          )}
        </div>

        <Dialog
          open={Boolean(feedbackPost)}
          onOpenChange={(open) => {
            if (!open) {
              setFeedbackPost(null);
              setReviewNote("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Changes</DialogTitle>
              <DialogDescription>
                This moves &ldquo;{feedbackPost?.title}&rdquo; back to draft status and notifies the author with your editorial note.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="editorial-note">
                  Editorial Note (optional)
                </Label>
                <Textarea
                  id="editorial-note"
                  rows={4}
                  placeholder="E.g., Please add benchmark numbers for the query plan section and include alt text on diagram 2."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFeedbackPost(null);
                  setReviewNote("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleRequestChangesSubmit}
                className="gap-2"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                Send Back to Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageShell>
    </LazyMotion>
  );
}

