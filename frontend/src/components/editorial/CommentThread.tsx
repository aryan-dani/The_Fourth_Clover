"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, Reply, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RelativeTime } from "@/components/time/RelativeTime";
import { cn } from "@/lib/utils";

export type CommentAuthor = {
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

export type CommentNode = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: CommentAuthor | null;
  replies?: CommentNode[];
};

export type CommentThreadProps = {
  comments: CommentNode[];
  canComment: boolean;
  currentUserId?: string | null;
  onAdd: (content: string, parentId?: string | null) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  className?: string;
  emptyMessage?: string;
};

function countComments(nodes: CommentNode[]): number {
  return nodes.reduce(
    (sum, node) => sum + 1 + countComments(node.replies ?? []),
    0,
  );
}

function CommentItem({
  comment,
  depth,
  canComment,
  currentUserId,
  onReply,
  onRequestDelete,
}: {
  comment: CommentNode;
  depth: number;
  canComment: boolean;
  currentUserId?: string | null;
  onReply: (parentId: string) => void;
  onRequestDelete: (id: string) => void;
}) {
  const author = comment.author;
  const displayName =
    author?.fullName?.trim() || author?.username || "Anonymous";
  const username = author?.username;
  const initial = displayName.charAt(0).toUpperCase();
  const canDelete = Boolean(currentUserId && currentUserId === comment.user_id);

  return (
    <li className={cn(depth > 0 && "ml-4 border-l border-hairline pl-4 sm:ml-6")}>
      <div className="flex gap-3">
        {username ? (
          <Link
            href={`/profile/${username}`}
            className="shrink-0 transition-opacity duration-editorial hover:opacity-80"
          >
            <Avatar className="h-8 w-8 border border-hairline">
              <AvatarImage
                src={author?.avatarUrl || undefined}
                alt={displayName}
              />
              <AvatarFallback className="bg-muted font-mono text-[10px] uppercase">
                {initial}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-8 w-8 border border-hairline">
            <AvatarFallback className="bg-muted font-mono text-[10px] uppercase">
              {initial}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {username ? (
              <Link
                href={`/profile/${username}`}
                className="text-sm font-medium text-foreground transition-colors duration-editorial hover:text-brand"
              >
                {displayName}
              </Link>
            ) : (
              <span className="text-sm font-medium text-foreground">
                {displayName}
              </span>
            )}
            <RelativeTime
              date={comment.created_at}
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
            />
          </div>

          <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground">
            {comment.content}
          </p>

          <div className="flex items-center gap-1">
            {canComment && depth < 3 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => onReply(comment.id)}
                aria-label={`Reply to ${displayName}`}
              >
                <Reply className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Reply
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRequestDelete(comment.id)}
                aria-label="Delete comment"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <ul className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              canComment={canComment}
              currentUserId={currentUserId}
              onReply={onReply}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CommentThread({
  comments,
  canComment,
  currentUserId,
  onAdd,
  onDelete,
  className,
  emptyMessage = "No comments yet. Start the conversation.",
}: CommentThreadProps) {
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = countComments(comments);

  const submit = () => {
    const content = draft.trim();
    if (!content || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await onAdd(content, replyTo);
        setDraft("");
        setReplyTo(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post comment");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteId || isPending) return;
    const id = deleteId;
    startTransition(async () => {
      try {
        await onDelete(id);
        setDeleteId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete comment");
        setDeleteId(null);
      }
    });
  };

  return (
    <section className={cn("space-y-6", className)} aria-label="Comments">
      <div className="flex items-center gap-2 border-b border-hairline pb-4">
        <MessageCircle className="h-4 w-4 text-brand" aria-hidden />
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Comments
        </h2>
        <span className="meta-label ml-auto tabular-nums">{total}</span>
      </div>

      {canComment ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {replyTo && (
            <div className="flex items-center justify-between gap-2 border border-hairline bg-muted/30 px-3 py-2">
              <p className="meta-label">Replying</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setReplyTo(null)}
                aria-label="Cancel reply"
              >
                Cancel
              </Button>
            </div>
          )}
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={replyTo ? "Write a reply…" : "Write a comment…"}
            rows={3}
            disabled={isPending}
            className="resize-y border-hairline font-serif"
            aria-label={replyTo ? "Reply" : "New comment"}
          />
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || draft.trim().length === 0}
              size="sm"
            >
              {isPending ? "Posting…" : replyTo ? "Post reply" : "Post comment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="border border-hairline px-4 py-3 font-serif text-sm text-muted-foreground">
          Sign in to join the discussion.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="py-6 text-center font-serif text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              canComment={canComment}
              currentUserId={currentUserId}
              onReply={setReplyTo}
              onRequestDelete={setDeleteId}
            />
          ))}
        </ul>
      )}

      <Dialog
        open={deleteId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Delete comment?</DialogTitle>
            <DialogDescription>
              This cannot be undone. The comment will be removed permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
