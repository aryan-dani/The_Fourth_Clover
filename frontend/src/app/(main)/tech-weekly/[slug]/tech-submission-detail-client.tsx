"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { CopyForLinkedInButton } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import {
  ArrowLeft,
  ThumbsUp,
  Lightbulb,
  Code2,
  MessageSquare,
  Reply,
  Trash2,
  Flag,
  CheckCircle2,
  XCircle,
  Edit3,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";
import { formatRelativeTime } from "@/lib/utils";
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

export function TechSubmissionDetailClient({
  submission: initialSubmission,
  initialComments,
  initialViewerReactions,
  allowMemberComments,
}: {
  submission: TechSubmissionWithAuthor;
  initialComments: TechCommentWithAuthor[];
  initialViewerReactions: TechReactionType[];
  allowMemberComments: boolean;
}) {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [submission, setSubmission] = useState(initialSubmission);
  const [viewerReactions, setViewerReactions] = useState<TechReactionType[]>(
    initialViewerReactions
  );
  const [comments, setComments] =
    useState<TechCommentWithAuthor[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reactingType, setReactingType] = useState<TechReactionType | null>(
    null
  );

  const [reviewNote, setReviewNote] = useState(submission.review_note || "");
  const [curationBusy, setCurationBusy] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "submission" | "comment";
    id: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportingBusy, setReportingBusy] = useState(false);

  const role = profile?.role || "unverified";
  const isSuperAdmin =
    role === "super_admin" ||
    profile?.csi_id === 303 ||
    Boolean(profile?.is_admin);
  const isTechHeadOrAdmin =
    isSuperAdmin ||
    role === "tech_head" ||
    profile?.csi_id === 241 ||
    profile?.csi_id === 246;
  const isTechMember =
    isTechHeadOrAdmin || (role === "tech_member" && Boolean(profile?.csi_id));
  const isVerifiedRoster =
    isTechMember || (role === "member" && Boolean(profile?.csi_id));
  const canComment =
    isTechMember || (isVerifiedRoster && allowMemberComments);
  const isAuthor = Boolean(user?.id && user.id === submission.author_id);

  const counts = submission.reaction_counts || {
    like: 0,
    insightful: 0,
    fire: 0,
    total: 0,
  };

  const handleToggleReaction = async (reactionType: TechReactionType) => {
    if (!user) {
      toast.error("Sign in with Google to endorse dispatches.");
      return;
    }
    if (reactionType !== "like" && !isTechMember) {
      toast.error(
        "Verify your CSI Technical ID to add Insightful and Rigorous endorsements."
      );
      return;
    }

    setReactingType(reactionType);
    try {
      const res = await toggleTechReactionAction({
        submissionId: submission.id,
        reactionType,
        slug: submission.slug,
      });

      if (!res.success) {
        toast.error(res.error || "Could not update endorsement.");
        return;
      }

      const added = Boolean(res.added);
      setViewerReactions((prev) =>
        added
          ? [...prev, reactionType]
          : prev.filter((r) => r !== reactionType)
      );

      setSubmission((prev) => {
        const c = prev.reaction_counts || {
          like: 0,
          insightful: 0,
          fire: 0,
          total: 0,
        };
        const delta = added ? 1 : -1;
        return {
          ...prev,
          reaction_counts: {
            ...c,
            [reactionType]: Math.max(0, c[reactionType] + delta),
            total: Math.max(0, c.total + delta),
          },
        };
      });
    } finally {
      setReactingType(null);
    }
  };

  const handleAddComment = async (parentId?: string | null) => {
    const text = (parentId ? replyText : newComment).trim();
    if (!text) return;

    setSubmittingComment(true);
    try {
      const res = await addTechCommentAction({
        submissionId: submission.id,
        content: text,
        parentId: parentId || null,
        slug: submission.slug,
      });

      if (!res.success || !res.comment) {
        toast.error(res.error || "Failed to post comment.");
        return;
      }

      const created: TechCommentWithAuthor = {
        ...res.comment,
        replies: [],
      };

      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), created] }
              : c
          )
        );
        setReplyText("");
        setReplyingToId(null);
      } else {
        setComments((prev) => [...prev, created]);
        setNewComment("");
      }

      toast.success("Comment published.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string, parentId?: string) => {
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
  };

  const handleReviewStatus = async (status: "approved" | "rejected") => {
    setCurationBusy(true);
    try {
      const res = await reviewTechSubmissionAction({
        submissionId: submission.id,
        status,
        reviewNote,
      });
      if (!res.success) {
        toast.error(res.error || "Could not update review status.");
        return;
      }
      setSubmission((prev) => ({
        ...prev,
        status,
        review_note: reviewNote || null,
      }));
      toast.success(
        status === "approved"
          ? "Dispatch marked as Approved."
          : "Revision note sent to author."
      );
      router.refresh();
    } finally {
      setCurationBusy(false);
    }
  };

  const handleSelectWeeklyPick = async () => {
    setCurationBusy(true);
    try {
      const res = await selectTechWeeklyPickAction({
        submissionId: submission.id,
        reviewNote,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to select weekly pick.");
        return;
      }
      setSubmission((prev) => ({
        ...prev,
        status: "selected",
        selected_at: new Date().toISOString(),
      }));
      toast.success(
        res.replacedId
          ? "Selected as this week's LinkedIn Feature (previous pick replaced and logged)."
          : "Selected as this week's official CSI LinkedIn Feature."
      );
      router.refresh();
    } finally {
      setCurationBusy(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportTarget || !reportReason.trim()) return;
    setReportingBusy(true);
    try {
      const res = await submitTechReportAction({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason,
      });
      if (!res.success) {
        toast.error(res.error || "Could not submit report.");
        return;
      }
      toast.success("Report submitted to CSI Moderation.");
      setReportModalOpen(false);
      setReportReason("");
    } finally {
      setReportingBusy(false);
    }
  };

  const authorName =
    submission.author?.full_name ||
    submission.author?.username ||
    "CSI Member";
  const authorBadge = submission.author?.dept
    ? `CSI ${submission.author.dept}${submission.author.year ? ` · ${submission.author.year}` : ""}`
    : "CSI Technical Wing";

  return (
    <LazyMotion features={domAnimation}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-10">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <Link
            href="/tech-weekly"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            CSI Tech Weekly Index
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {(isAuthor || isSuperAdmin) && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-md text-xs"
              >
                <Link href={`/tech-weekly/write?id=${submission.id}`}>
                  <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                  Edit Dispatch
                </Link>
              </Button>
            )}
            {submission.status === "selected" && isTechHeadOrAdmin && (
              <CopyForLinkedInButton submission={submission} size="sm" />
            )}
          </div>
        </div>

        {/* Technical Head & Super Admin Curation Bar */}
        {isTechHeadOrAdmin && (
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-foreground">
                Editorial Board Curation Controls
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Status: {submission.status.toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Editorial note or feedback for author..."
                className="h-9 text-xs flex-1 rounded-md"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={curationBusy}
                  onClick={() => void handleReviewStatus("approved")}
                  className="h-9 rounded-md text-xs"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={curationBusy}
                  onClick={() => void handleReviewStatus("rejected")}
                  className="h-9 rounded-md text-xs"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Request Revision
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={curationBusy || submission.status === "selected"}
                  onClick={() => void handleSelectWeeklyPick()}
                  className="h-9 rounded-md text-xs"
                >
                  {submission.status === "selected"
                    ? "Selected for LinkedIn"
                    : "Select as Weekly Pick"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Monograph Header */}
        <m.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <header className="space-y-5 border-b border-border pb-8">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>{submission.week?.title || "CSI Tech Weekly"}</span>
              <span>·</span>
              <span>
                <Clock className="inline h-3 w-3 -mt-0.5 mr-1" />
                {submission.read_time} MIN READ ({submission.word_count} WORDS)
              </span>
              {submission.status === "selected" && (
                <>
                  <span>·</span>
                  <span className="border border-foreground px-1.5 py-0.5 text-[10px] text-foreground">
                    OFFICIAL LINKEDIN SELECTION
                  </span>
                </>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.12]">
              {submission.title}
            </h1>

            {submission.summary && (
              <p className="font-serif text-lg sm:text-xl text-muted-foreground leading-relaxed">
                {submission.summary}
              </p>
            )}

            {submission.tags && submission.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {submission.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground border border-border bg-card px-2.5 py-0.5 rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/70">
              <Link
                href={`/profile/${submission.author?.username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-10 w-10 rounded-sm border border-border">
                  <AvatarImage src={submission.author?.avatar_url || ""} />
                  <AvatarFallback className="rounded-sm font-mono text-xs">
                    {authorName[0]?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:underline">
                    {authorName}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {authorBadge}
                    {submission.author?.csi_id
                      ? ` · CSI #${submission.author.csi_id}`
                      : ""}{" "}
                    · {formatRelativeTime(submission.created_at)}
                  </p>
                </div>
              </Link>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setReportTarget({
                      type: "submission",
                      id: submission.id,
                    });
                    setReportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  <Flag className="h-3 w-3" />
                  Report
                </button>
              )}
            </div>
          </header>

          {submission.cover_image && (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-border bg-muted">
              <Image
                src={submission.cover_image}
                alt={submission.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {/* Markdown Monograph Body */}
          <div className="py-2">
            <PostBodyRenderer content={submission.content} forceMarkdown />
          </div>

          {/* Peer Endorsement Bar (Zero Emojis / Zero Fire Icons) */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-5">
            <div className="flex flex-wrap items-center gap-2.5">
              {(
                [
                  {
                    type: "like" as const,
                    label: "Endorse",
                    icon: ThumbsUp,
                    count: counts.like,
                  },
                  {
                    type: "insightful" as const,
                    label: "Insightful",
                    icon: Lightbulb,
                    count: counts.insightful,
                  },
                  {
                    type: "fire" as const,
                    label: "Well-Engineered",
                    icon: Code2,
                    count: counts.fire,
                  },
                ] as const
              ).map((item) => {
                const active = viewerReactions.includes(item.type);
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    disabled={reactingType === item.type}
                    onClick={() => void handleToggleReaction(item.type)}
                    className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-xs font-medium transition-colors ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-foreground hover:border-foreground/40"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                    <span className="font-mono text-[11px] tabular-nums opacity-80">
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="font-mono text-xs text-muted-foreground tabular-nums">
              <MessageSquare className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              {comments.reduce(
                (acc, c) => acc + 1 + (c.replies?.length || 0),
                0
              )}{" "}
              responses
            </div>
          </div>
        </m.article>

        {/* Threaded Technical Discussion */}
        <section className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Technical Discourse
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Peer Review & Commentary
            </span>
          </div>

          {canComment ? (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="Contribute technical feedback, architectural questions, or benchmarks..."
                className="text-sm resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
              />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-mono text-[11px] text-muted-foreground">
                  Commenting as CSI #{profile?.csi_id ?? "Verified"}
                </span>
                <Button
                  type="button"
                  size="sm"
                  disabled={submittingComment || !newComment.trim()}
                  onClick={() => void handleAddComment(null)}
                  className="rounded-md px-4 text-xs"
                >
                  {submittingComment && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  Post Response
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-5 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
              <span>
                {!user
                  ? "Sign in with Google and verify your CSI Technical ID to join the technical discussion."
                  : role === "unverified"
                    ? "Verify your CSI ID and PRN to participate in technical discussions."
                    : "Commentary is currently restricted to verified CSI Technical Wing members."}
              </span>
              {!user ? (
                <Button asChild size="sm" variant="outline" className="rounded-md">
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
              ) : role === "unverified" ? (
                <Button asChild size="sm" variant="outline" className="rounded-md">
                  <Link href="/verify-csi">Verify CSI ID</Link>
                </Button>
              ) : null}
            </div>
          )}

          <div className="divide-y divide-border">
            {comments.map((comment) => {
              const cAuthor =
                comment.author?.full_name ||
                comment.author?.username ||
                "CSI Member";
              const canDelete =
                user?.id === comment.user_id || isSuperAdmin;

              return (
                <div key={comment.id} className="py-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-foreground">
                          {cAuthor}
                        </span>
                        {comment.author?.csi_id && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            CSI #{comment.author.csi_id} ·{" "}
                            {comment.author.dept || "Tech"}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-muted-foreground">
                          · {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {canComment && (
                          <button
                            type="button"
                            onClick={() =>
                              setReplyingToId(
                                replyingToId === comment.id ? null : comment.id
                              )
                            }
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            <Reply className="h-3 w-3" />
                            Reply
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteComment(comment.id)
                            }
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>

                  {/* Reply Input */}
                  {replyingToId === comment.id && (
                    <div className="ml-6 rounded-md border border-border bg-card p-3 space-y-2">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        placeholder={`Reply to ${cAuthor}...`}
                        className="text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setReplyingToId(null)}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={submittingComment || !replyText.trim()}
                          onClick={() => void handleAddComment(comment.id)}
                          className="h-7 text-xs rounded-md"
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 1-Level Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 border-l border-border pl-4 space-y-3">
                      {comment.replies.map((reply) => {
                        const rAuthor =
                          reply.author?.full_name ||
                          reply.author?.username ||
                          "CSI Member";
                        const canDeleteReply =
                          user?.id === reply.user_id || isSuperAdmin;
                        return (
                          <div key={reply.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {rAuthor}
                                </span>
                                {reply.author?.csi_id && (
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    CSI #{reply.author.csi_id}
                                  </span>
                                )}
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  · {formatRelativeTime(reply.created_at)}
                                </span>
                              </div>
                              {canDeleteReply && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDeleteComment(
                                      reply.id,
                                      comment.id
                                    )
                                  }
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Report Modal */}
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-4 shadow-xl">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Report Content to CSI Moderation
              </h3>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={3}
                placeholder="Describe why this content violates publication standards..."
                className="text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={reportingBusy || reportReason.trim().length < 3}
                  onClick={() => void handleReportSubmit()}
                >
                  Submit Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LazyMotion>
  );
}
