"use client";

import { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AddComment } from "./AddComment";
import { Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CommentType {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  post_id: string;
  parent_id: string | null;
  author: {
    username: string;
    avatar_url: string;
  };
  replies?: CommentType[];
}

interface CommentProps {
  comment: CommentType;
  postId: string;
  onReplyAdded: (comment: CommentType) => void;
  onCommentDeleted: (commentId: string) => Promise<void>;
  currentUserId?: string;
}

export function Comment({
  comment,
  postId,
  onReplyAdded,
  onCommentDeleted,
  currentUserId,
}: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId === comment.author_id;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onCommentDeleted(comment.id);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex space-x-4">
      <Avatar>
        <AvatarImage src={comment.author.avatar_url} />
        <AvatarFallback>
          {comment.author.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold">{comment.author.username}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this comment? This
                        action cannot be undone
                        {hasReplies
                          ? " and will also delete all replies to this comment"
                          : ""}
                        .
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="mt-1">{comment.content}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="mt-2"
        >
          Reply
        </Button>
        {showReplyForm && (
          <div className="mt-4">
            <AddComment
              postId={postId}
              parentId={comment.id}
              onCommentAdded={(newReply) => {
                onReplyAdded(newReply);
                setShowReplyForm(false);
              }}
            />
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-6 space-y-6 border-l-2 pl-6">
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                postId={postId}
                onReplyAdded={onReplyAdded}
                onCommentDeleted={onCommentDeleted}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
