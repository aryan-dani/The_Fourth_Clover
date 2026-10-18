"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { CopyForLinkedInButton } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import { useAuth } from "@/features/auth/auth-context";
import {
  toggleTechReactionAction,
  addTechCommentAction,
  deleteTechCommentAction,
  submitTechReportAction,
  reviewTechSubmissionAction,
  selectTechWeeklyPickAction,
} from "@/features/data/tech-weekly-actions";
import type {
  TechCommentWithAuthor,
  TechReactionType,
  TechSubmissionWithAuthor,
} from "@/types/database";
import { formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft,
  Award,
  Heart,
  Lightbulb,
  Flame,
  MessageCircle,
  Flag,
  Clock,
  CheckCircle2,
  XCircle,
  Reply,
  Trash2,
  Loader2,
  Send,
  Edit3,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

function formatAuthorCsiBadge(author: TechSubmissionWithAuthor["author"]): string {
  if (author.role === "super_admin" || author.csi_id === 303) {
    return "CSI Tech Secretary (#303)";
  }
  if (
    author.role === "tech_head" ||
    author.csi_id === 241 ||
    author.csi_id === 246
  ) {
    return `CSI Tech Head (#${author.csi_id || ""})`;
  }
  const dept = author.dept || "Tech";
  return author.year ? `CSI ${dept} · ${author.year}` : `CSI ${dept}`;
}

export function TechSubmissionDetailClient({
  initialSubmission,
  initialComments,
  initialViewerReactions,
  allowMemberComments,
}: {
  initialSubmission: TechSubmissionWithAuthor;
  initialComments: TechCommentWithAuthor[];
  initialViewerReactions: TechReactionType[];
  allowMemberComments: boolean;
}) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [submission, setSubmission] = useState(initialSubmission);
  const [comments, setComments] = useState(initialComments);
  const [viewerReactions, setViewerReactions] = useState<TechReactionType[]>(
    initialViewerReactions
  );
  const [commentText, setCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reportTarget, setReportTarget] = useState<{
    type: "submission" | "comment";
    id: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reviewNote, setReviewNote] = useState(submission.review_note || "");
  const [isPending, startTransition] = useTransition();

  const isVerifiedTech =
    profile?.role === "tech_member" ||
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    Boolean(profile?.is_admin);

  const isTechHeadOrAdmin =
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    profile?.csi_id === 241 ||
    profile?.csi_id === 246 ||
    profile?.csi_id === 303 ||
    Boolean(profile?.is_admin);

  const isSuperAdmin =
    profile?.role === "super_admin" ||
    profile?.csi_id === 303 ||
    Boolean(profile?.is_admin);

  const canComment =
    isVerifiedTech ||
    (allowMemberComments &&
      Boolean(profile?.csi_id && profile?.role && profile.role !== "unverified"));

  const isAuthor = Boolean(user?.id && user.id === submission.author_id);

  const handleToggleReaction = (type: TechReactionType) => {
    if (!user) {
      toast.error("Sign in with Google to react.");
      return;
    }

    startTransition(async () => {
      const res = await toggleTechReactionAction({
        submissionId: submission.id,
        reactionType: type,
        slug: submission.slug,
      });

      if (!res.success) {
        toast.error(res.error || "Could not update reaction.");
        return;
      }

      const counts = {
        like: submission.reaction_counts?.like || 0,
        insightful: submission.reaction_counts?.insightful || 0,
        fire: submission.reaction_counts?.fire || 0,
        total: submission.reaction_counts?.total || 0,
      };

      const delta = res.added ? 1 : -1;
      counts[type] = Math.max(0, counts[type] + delta);
      counts.total = Math.max(0, counts.total + delta);

      setSubmission((prev) => ({ ...prev, reaction_counts: counts }));
      setViewerReactions((prev) =>
        res.added ? [...prev, type] : prev.filter((r) => r !== type)
      );
    });
  };

  const handlePostComment = (parentId: string | null = null) => {
    const content = parentId ? replyText : commentText;
    if (!content.trim()) return;

    startTransition(async () => {
      const res = await addTechCommentAction({
        submissionId: submission.id,
        content,
        parentId,
        slug: submission.slug,
      });

      if (!res.success || !res.comment) {
        toast.error(res.error || "Could not post comment.");
        return;
      }

      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), res.comment!] }
              : c
          )
        );
        setReplyText("");
        setReplyingToId(null);
      } else {
        setComments((prev) => [...prev, { ...res.comment!, replies: [] }]);
        setCommentText("");
      }
      toast.success("Comment posted!");
    });
  };

  const handleDeleteComment = (commentId: string, parentId: string | null) => {
    startTransition(async () => {
      const res = await deleteTechCommentAction({
        commentId,
        slug: submission.slug,
      });
      if (!res.success) {
        toast.error(res.error || "Could not delete comment.");
        return;
      }
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? {
                  ...c,
                  replies: (c.replies || []).filter((r) => r.id !== commentId),
                }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
      toast.success("Comment removed.");
    });
  };

  const handleReviewStatus = (status: "approved" | "rejected") => {
    startTransition(async () => {
      const res = await reviewTechSubmissionAction({
        submissionId: submission.id,
        status,
        reviewNote,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to update review status.");
        return;
      }
      setSubmission((prev) => ({
        ...prev,
        status,
        review_note: reviewNote || null,
      }));
      toast.success(
        status === "approved"
          ? "Submission approved!"
          : "Submission marked as rejected."
      );
      router.refresh();
    });
  };

  const handleSelectWeeklyPick = () => {
    startTransition(async () => {
      const res = await selectTechWeeklyPickAction({
        submissionId: submission.id,
        reviewNote,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to select Weekly LinkedIn Pick.");
        return;
      }
      setSubmission((prev) => ({
        ...prev,
        status: "selected",
        review_note: reviewNote || prev.review_note,
      }));
      toast.success(
        res.replacedId
          ? "Selected as This Week's LinkedIn Pick (previous pick replaced and audit logged)!"
          : "Selected as This Week's Official CSI LinkedIn Pick!"
      );
      router.refresh();
    });
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;

    startTransition(async () => {
      const res = await submitTechReportAction({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason,
      });
      if (!res.success) {
        toast.error(res.error || "Could not submit report.");
        return;
      }
      toast.success("Report submitted to CSI moderation queue.");
      setReportTarget(null);
      setReportReason("");
    });
  };

  const authorName =
    submission.author?.full_name || submission.author?.username || "CSI Member";

  return (
    <PageShell className="max-w-4xl space-y-8 pb-20">
      <LazyMotion features={domAnimation}>
        {/* Top Navigation */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" asChild className="-ml-2 rounded-xl">
            <Link href="/tech-weekly">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CSI Tech Weekly
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {(isAuthor || isSuperAdmin) && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href={`/tech-weekly/write?id=${submission.id}`}>
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  Edit Submission
                </Link>
              </Button>
            )}
            <CopyForLinkedInButton
              submission={submission}
              size="sm"
              variant="secondary"
            />
          </div>
        </div>

        {/* Technical Head / Super Admin Review Panel */}
        {isTechHeadOrAdmin && (
          <Card className="rounded-3xl border-emerald-500/40 bg-emerald-500/5 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span className="font-display font-semibold text-sm sm:text-base">
                  Technical Head &amp; Secretary Curation Controls
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                Current Status: {submission.status.toUpperCase()}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Optional review note for the author..."
                className="rounded-xl flex-1 bg-background/80"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleReviewStatus("approved")}
                  className="rounded-xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleReviewStatus("rejected")}
                  className="rounded-xl border-rose-500/40 text-rose-500"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={handleSelectWeeklyPick}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold"
                >
                  <Award className="h-4 w-4 mr-1.5" />
                  {submission.status === "selected"
                    ? "Selected for LinkedIn"
                    : "Select as Weekly LinkedIn Pick"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Article Header */}
        <m.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-8"
        >
          <header className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {submission.status === "selected" && (
                <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-400 font-semibold px-3 py-1 rounded-full">
                  <Award className="h-3.5 w-3.5 mr-1.5" />
                  Official CSI Weekly LinkedIn Pick
                </Badge>
              )}
              {submission.week?.title && (
                <Badge variant="outline" className="rounded-full">
                  {submission.week.title}
                </Badge>
              )}
              {submission.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {submission.title}
            </h1>

            {submission.summary && (
              <p className="font-serif text-lg sm:text-xl text-muted-foreground leading-relaxed">
                {submission.summary}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border/60">
              <Link
                href={`/profile/${submission.author?.username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-11 w-11 ring-2 ring-emerald-500/25">
                  <AvatarImage src={submission.author?.avatar_url || ""} />
                  <AvatarFallback className="font-bold">
                    {authorName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                      {authorName}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[11px] bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                    >
                      {formatAuthorCsiBadge(submission.author)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    @{submission.author?.username} ·{" "}
                    {formatRelativeTime(
                      submission.submitted_at || submission.created_at
                    )}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {submission.read_time} min read
                </span>
                <span>·</span>
                <span>{submission.word_count} words</span>
              </div>
            </div>
          </header>

          {submission.cover_image && (
            <div className="overflow-hidden rounded-3xl border border-border/60 aspect-video relative bg-muted/30">
              <Image
                src={submission.cover_image}
                alt={submission.title}
                width={1200}
                height={675}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          )}

          {/* Markdown Article Body */}
          <div className="pt-2">
            <PostBodyRenderer content={submission.content} forceMarkdown />
          </div>

          {/* Multi-Reaction & Report Bar */}
          <Card className="rounded-3xl border-border/70 bg-card/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant={
                    viewerReactions.includes("like") ? "default" : "outline"
                  }
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleToggleReaction("like")}
                  className="rounded-full gap-2"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      viewerReactions.includes("like")
                        ? "fill-current"
                        : "text-rose-500"
                    }`}
                  />
                  <span>Like</span>
                  <span className="font-mono text-xs">
                    {submission.reaction_counts?.like || 0}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant={
                    viewerReactions.includes("insightful")
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleToggleReaction("insightful")}
                  className="rounded-full gap-2"
                >
                  <Lightbulb
                    className={`h-4 w-4 ${
                      viewerReactions.includes("insightful")
                        ? "fill-current"
                        : "text-amber-500"
                    }`}
                  />
                  <span>Insightful</span>
                  <span className="font-mono text-xs">
                    {submission.reaction_counts?.insightful || 0}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant={
                    viewerReactions.includes("fire") ? "default" : "outline"
                  }
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleToggleReaction("fire")}
                  className="rounded-full gap-2"
                >
                  <Flame
                    className={`h-4 w-4 ${
                      viewerReactions.includes("fire")
                        ? "fill-current"
                        : "text-orange-500"
                    }`}
                  />
                  <span>Fire</span>
                  <span className="font-mono text-xs">
                    {submission.reaction_counts?.fire || 0}
                  </span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <CopyForLinkedInButton
                  submission={submission}
                  size="sm"
                  variant="outline"
                />
                {user && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setReportTarget({
                        type: "submission",
                        id: submission.id,
                      })
                    }
                    className="rounded-full text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Flag className="h-3.5 w-3.5 mr-1" />
                    Report
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Report Modal Box */}
          {reportTarget && (
            <Card className="rounded-2xl border-rose-500/40 bg-rose-500/5 p-4">
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <p className="text-sm font-semibold">
                  Report {reportTarget.type} to CSI Moderation
                </p>
                <Textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe why this content should be reviewed..."
                  rows={2}
                  required
                  className="rounded-xl bg-background"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setReportTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                  >
                    Submit Report
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* 1-Level Threaded Comments */}
          <section className="space-y-6 pt-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-500" />
              Peer Discussion ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
            </h2>

            {canComment ? (
              <Card className="rounded-3xl border-border/70 bg-card/75 p-4 space-y-3">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share constructive technical feedback or ask a question..."
                  rows={3}
                  className="rounded-2xl resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending || !commentText.trim()}
                    onClick={() => handlePostComment(null)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-1.5" />
                    )}
                    Post Comment
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="rounded-2xl border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground flex items-center justify-between gap-3 flex-wrap">
                <span>
                  {user
                    ? "Verify your CSI Technical ID to post comments and replies."
                    : "Sign in with Google and verify your CSI ID to join the technical discussion."}
                </span>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href={user ? "/verify-csi" : "/auth/signin"}>
                    {user ? "Verify CSI ID" : "Sign In"}
                  </Link>
                </Button>
              </Card>
            )}

            <div className="space-y-4">
              {comments.map((comment) => {
                const cAuthor =
                  comment.author?.full_name || comment.author?.username || "Member";
                const canDelete =
                  isSuperAdmin || (user?.id && user.id === comment.user_id);

                return (
                  <Card
                    key={comment.id}
                    className="rounded-2xl border-border/70 bg-card/70 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author?.avatar_url || ""} />
                          <AvatarFallback className="text-xs font-bold">
                            {cAuthor[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {cAuthor}
                            </span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                              {formatAuthorCsiBadge(comment.author)}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {formatRelativeTime(comment.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {canComment && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setReplyingToId(
                                replyingToId === comment.id ? null : comment.id
                              )
                            }
                            className="h-7 px-2 text-xs"
                          >
                            <Reply className="h-3.5 w-3.5 mr-1" />
                            Reply
                          </Button>
                        )}
                        {user && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setReportTarget({
                                type: "comment",
                                id: comment.id,
                              })
                            }
                            className="h-7 px-2 text-xs text-muted-foreground"
                          >
                            <Flag className="h-3 w-3" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteComment(comment.id, null)
                            }
                            className="h-7 px-2 text-xs text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap pl-10">
                      {comment.content}
                    </p>

                    {/* 1-Level Reply Composer */}
                    {replyingToId === comment.id && (
                      <div className="pl-10 pt-2 space-y-2">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Reply to ${cAuthor}...`}
                          rows={2}
                          className="rounded-xl text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setReplyingToId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPending || !replyText.trim()}
                            onClick={() => handlePostComment(comment.id)}
                            className="rounded-xl"
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 1-Level Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="pl-6 sm:pl-10 pt-2 space-y-2.5 border-l-2 border-border/60 ml-4">
                        {comment.replies.map((reply) => {
                          const rAuthor =
                            reply.author?.full_name ||
                            reply.author?.username ||
                            "Member";
                          const canDeleteReply =
                            isSuperAdmin ||
                            (user?.id && user.id === reply.user_id);

                          return (
                            <div
                              key={reply.id}
                              className="rounded-xl bg-muted/35 p-3 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={reply.author?.avatar_url || ""}
                                    />
                                    <AvatarFallback className="text-[10px] font-bold">
                                      {rAuthor[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-semibold">
                                    {rAuthor}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] h-4 px-1.5"
                                  >
                                    {formatAuthorCsiBadge(reply.author)}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatRelativeTime(reply.created_at)}
                                  </span>
                                </div>
                                {canDeleteReply && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteComment(reply.id, comment.id)
                                    }
                                    className="h-6 px-1.5 text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap pl-8">
                                {reply.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        </m.article>
      </LazyMotion>
    </PageShell>
  );
}
