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
  Sparkles,
  Loader2,
  ExternalLink,
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
} from "@/features/data/server-actions";
import { formatDate, formatReadTime } from "@/lib/utils";
import { toast } from "sonner";
import type { PostWithAuthor } from "@/types/database";

type CsiReviewClientProps = {
  initialPosts: PostWithAuthor[];
  publicationName: string;
};

export function CsiReviewClient({
  initialPosts,
  publicationName,
}: CsiReviewClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialPosts[0]?.id ?? null,
  );
  const [feedbackPost, setFeedbackPost] = useState<PostWithAuthor | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (post: PostWithAuthor) => {
    setActivePostId(post.id);
    startTransition(async () => {
      const result = await approvePublicationPostAction(post.id);
      setActivePostId(null);

      if (!result.ok) {
        toast.error(result.error || "Failed to approve post.");
        return;
      }

      setPosts((prev) => prev.filter((item) => item.id !== post.id));
      toast.success(`Published "${post.title}" to CSI Tech Blog!`);
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

  return (
    <LazyMotion features={domAnimation}>
      <PageShell className="py-8">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge className="bg-primary/15 text-primary border-primary/30 rounded-full px-3 py-0.5 text-xs">
                  Editorial Queue
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {publicationName}
                </span>
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Submissions in Review
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Inspect technical accuracy, formatting, and inline figures before publishing to `/csi`.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
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

          {posts.length === 0 ? (
            <Card className="glass-card border-border/60">
              <CardContent className="p-12 text-center">
                <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Sparkles className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="font-display mb-2 text-xl font-semibold">
                  All caught up!
                </h2>
                <p className="text-muted-foreground mx-auto mb-6 max-w-md text-sm">
                  There are no pending articles in the CSI review queue right now. New writer submissions will appear here automatically.
                </p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/csi">Browse Published CSI Articles</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post, index) => {
                const isExpanded = expandedId === post.id;
                const isBusy = isPending && activePostId === post.id;

                return (
                  <m.div
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                  >
                    <Card className="glass-card border-border/60 overflow-hidden">
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
                                {formatReadTime(post.read_time)}
                              </span>
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
                              <MessageSquareWarning className="h-4 w-4" aria-hidden />
                              Request Changes
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleApprove(post)}
                              className="gap-1.5 rounded-full"
                            >
                              {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" aria-hidden />
                              )}
                              Approve & Publish
                            </Button>
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
