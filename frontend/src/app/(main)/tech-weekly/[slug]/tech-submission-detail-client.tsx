"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArticleLayout,
  BookmarkButton,
  CommentThread,
  ReactionBar,
  ShareMenu,
  TagChip,
  type CommentNode,
} from "@/components/editorial";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { CopyForLinkedInButton } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import {
  ArrowLeft,
  ThumbsUp,
  Lightbulb,
  Code2,
  Flag,
  CheckCircle2,
  XCircle,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/lib/supabase";
import {
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

function toCommentNodes(
  comments: TechCommentWithAuthor[],
): CommentNode[] {
  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    user_id: c.user_id,
    author: c.author
      ? {
          username: c.author.username,
          fullName: c.author.full_name,
          avatarUrl: c.author.avatar_url,
        }
      : null,
    replies: c.replies ? toCommentNodes(c.replies) : [],
  }));
}

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
    initialViewerReactions,
  );
  const [comments, setComments] =
    useState<TechCommentWithAuthor[]>(initialComments);

  const [reviewNote, setReviewNote] = useState(submission.review_note || "");
  const [curationBusy, setCurationBusy] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "submission" | "comment";
    id: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportingBusy, setReportingBusy] = useState(false);
  const [reactingType, setReactingType] = useState<TechReactionType | null>(
    null,
  );

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

  const commentNodes = useMemo(() => toCommentNodes(comments), [comments]);

  const handleToggleReaction = async (reactionType: TechReactionType) => {
    if (!user) {
      toast.error("Sign in with Google to endorse dispatches.");
      return;
    }
    if (reactionType !== "like" && !isTechMember) {
      toast.error(
        "Verify your CSI Technical ID to add Insightful and Rigorous endorsements.",
      );
      return;
    }

    setReactingType(reactionType);
    try {
      const { data: existing, error: lookupError } = await supabase
        .from("tech_reactions")
        .select("id")
        .eq("submission_id", submission.id)
        .eq("user_id", user.id)
        .eq("reaction_type", reactionType)
        .maybeSingle();

      if (lookupError) {
        toast.error(lookupError.message || "Could not update endorsement.");
        return;
      }

      let added = false;
      if (existing?.id) {
        const { error } = await supabase
          .from("tech_reactions")
          .delete()
          .eq("id", existing.id);
        if (error) {
          toast.error(error.message || "Could not remove endorsement.");
          return;
        }
        added = false;
      } else {
        const { error } = await supabase.from("tech_reactions").insert({
          submission_id: submission.id,
          user_id: user.id,
          reaction_type: reactionType,
        });
        if (error) {
          toast.error(
            error.message || "Verify your CSI ID to use technical reactions.",
          );
          return;
        }
        added = true;
      }

      setViewerReactions((prev) =>
        added
          ? [...prev, reactionType]
          : prev.filter((r) => r !== reactionType),
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
      router.refresh();
    } catch (err) {
      console.error("toggleTechReaction failed:", err);
      toast.error("Could not update endorsement.");
    } finally {
      setReactingType(null);
    }
  };

  const handleAddComment = async (
    content: string,
    parentId?: string | null,
  ) => {
    const res = await addTechCommentAction({
      submissionId: submission.id,
      content,
      parentId: parentId || null,
      slug: submission.slug,
    });

    if (!res.success || !res.comment) {
      toast.error(res.error || "Failed to post comment.");
      throw new Error(res.error || "Failed to post");
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
            : c,
        ),
      );
    } else {
      setComments((prev) => [...prev, created]);
    }

    toast.success("Comment published.");
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await deleteTechCommentAction({
      commentId,
      slug: submission.slug,
    });
    if (!res.success) {
      toast.error(res.error || "Could not delete comment.");
      throw new Error(res.error || "Delete failed");
    }

    setComments((prev) => {
      const remove = (
        nodes: TechCommentWithAuthor[],
      ): TechCommentWithAuthor[] =>
        nodes
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies ? remove(c.replies) : [],
          }));
      return remove(prev);
    });
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
          : "Revision note sent to author.",
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
          ? "Selected as this week's LinkedIn Feature (previous pick replaced)."
          : "Selected as this week's official CSI LinkedIn Feature.",
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
      setReportTarget(null);
    } finally {
      setReportingBusy(false);
    }
  };

  const authorName =
    submission.author?.full_name ||
    submission.author?.username ||
    "CSI Member";

  return (
    <div className="mx-auto w-full max-w-article space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <Link
          href="/tech-weekly"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Tech Weekly Index
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {(isAuthor || isSuperAdmin) && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-hairline"
            >
              <Link href={`/tech-weekly/write?id=${submission.id}`}>
                <Edit3 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Edit Dispatch
              </Link>
            </Button>
          )}
          {submission.status === "selected" && isTechHeadOrAdmin && (
            <CopyForLinkedInButton submission={submission} size="sm" />
          )}
          <ShareMenu title={submission.title} />
        </div>
      </div>

      {isTechHeadOrAdmin && (
        <div className="space-y-4 border border-hairline p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
            <span className="meta-label text-foreground">
              Editorial curation
            </span>
            <span className="meta-label">
              Status: {submission.status}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Editorial note or feedback for author…"
              className="h-9 flex-1 border-hairline text-xs"
              aria-label="Editorial review note"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={curationBusy}
                onClick={() => void handleReviewStatus("approved")}
                className="border-hairline"
                aria-label="Approve dispatch"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={curationBusy}
                onClick={() => void handleReviewStatus("rejected")}
                className="border-hairline"
                aria-label="Request revision"
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Request Revision
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={curationBusy || submission.status === "selected"}
                onClick={() => void handleSelectWeeklyPick()}
                aria-label="Select as weekly LinkedIn pick"
              >
                {submission.status === "selected"
                  ? "Selected for LinkedIn"
                  : "Select as Weekly Pick"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ArticleLayout
        sectionLabel={submission.week?.title || "CSI Tech Weekly"}
        sectionHref="/tech-weekly"
        title={submission.title}
        dek={submission.summary}
        author={
          submission.author
            ? {
                username: submission.author.username,
                fullName: submission.author.full_name,
                avatarUrl: submission.author.avatar_url,
                dept: submission.author.dept,
                year: submission.author.year,
                isCsi: true,
              }
            : null
        }
        publishedAt={submission.created_at}
        readTime={submission.read_time}
        coverImage={submission.cover_image}
        showProgress
        actions={
          <div className="flex flex-wrap items-center gap-1">
            <BookmarkButton
              targetType="tech_submission"
              targetId={submission.id}
            />
            <ShareMenu title={submission.title} />
            {user ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setReportTarget({ type: "submission", id: submission.id });
                  setReportModalOpen(true);
                }}
                aria-label="Report this dispatch"
              >
                <Flag className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Report
              </Button>
            ) : null}
          </div>
        }
        reactions={
          <div className="space-y-4">
            {submission.tags && submission.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {submission.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            )}
            {submission.status === "selected" && (
              <p className="meta-label text-foreground">
                Official LinkedIn selection
              </p>
            )}
            <ReactionBar
              items={[
                {
                  key: "like",
                  label: "Endorse",
                  icon: <ThumbsUp className="h-3.5 w-3.5" aria-hidden />,
                  count: counts.like,
                  active: viewerReactions.includes("like"),
                  disabled: reactingType === "like",
                  onClick: () => void handleToggleReaction("like"),
                },
                {
                  key: "insightful",
                  label: "Insightful",
                  icon: <Lightbulb className="h-3.5 w-3.5" aria-hidden />,
                  count: counts.insightful,
                  active: viewerReactions.includes("insightful"),
                  disabled: reactingType === "insightful",
                  onClick: () => void handleToggleReaction("insightful"),
                },
                {
                  key: "fire",
                  label: "Well-Engineered",
                  icon: <Code2 className="h-3.5 w-3.5" aria-hidden />,
                  count: counts.fire,
                  active: viewerReactions.includes("fire"),
                  disabled: reactingType === "fire",
                  onClick: () => void handleToggleReaction("fire"),
                },
              ]}
            />
            <p className="font-mono text-[11px] text-muted-foreground">
              {submission.word_count} words · authored by {authorName}
            </p>
          </div>
        }
        comments={
          canComment || comments.length > 0 ? (
            <CommentThread
              comments={commentNodes}
              canComment={canComment}
              currentUserId={user?.id}
              onAdd={handleAddComment}
              onDelete={handleDeleteComment}
              emptyMessage={
                !user
                  ? "Sign in and verify your CSI ID to join the discussion."
                  : role === "unverified"
                    ? "Verify your CSI ID to participate in technical discussions."
                    : "No comments yet. Start the technical discourse."
              }
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-hairline px-4 py-4 font-serif text-sm text-muted-foreground">
              <span>
                {!user
                  ? "Sign in with Google and verify your CSI Technical ID to join the discussion."
                  : role === "unverified"
                    ? "Verify your CSI ID and PRN to participate."
                    : "Commentary is restricted to verified CSI Technical Wing members."}
              </span>
              {!user ? (
                <Button asChild size="sm" variant="outline" className="border-hairline">
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
              ) : role === "unverified" ? (
                <Button asChild size="sm" variant="outline" className="border-hairline">
                  <Link href="/verify-csi">Verify CSI ID</Link>
                </Button>
              ) : null}
            </div>
          )
        }
      >
        <PostBodyRenderer content={submission.content} forceMarkdown />
      </ArticleLayout>

      <Dialog
        open={reportModalOpen}
        onOpenChange={(open) => {
          setReportModalOpen(open);
          if (!open) {
            setReportReason("");
            setReportTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              Report to CSI Moderation
            </DialogTitle>
            <DialogDescription>
              Describe why this content violates publication standards.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={3}
            placeholder="Reason for report…"
            className="border-hairline font-serif text-sm"
            aria-label="Report reason"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-hairline"
              onClick={() => setReportModalOpen(false)}
              disabled={reportingBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={reportingBusy || reportReason.trim().length < 3}
              onClick={() => void handleReportSubmit()}
              aria-label="Submit report"
            >
              {reportingBusy ? "Submitting…" : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
