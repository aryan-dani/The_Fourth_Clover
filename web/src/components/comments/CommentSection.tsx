"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { AddComment } from "@/components/comments/AddComment";
import { Comment } from "@/components/comments/Comment";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

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

export function CommentSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalComments, setTotalComments] = useState(0);

  // Update total comments count
  const updateTotalComments = (comments: CommentType[]): number => {
    let total = 0;
    comments.forEach((comment) => {
      total += 1; // Count the comment itself
      if (comment.replies) {
        total += updateTotalComments(comment.replies); // Count replies recursively
      }
    });
    return total;
  };

  useEffect(() => {
    const total = updateTotalComments(comments);
    setTotalComments(total);
  }, [comments]);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);

    // First, get comments
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      toast.error("Failed to load comments.");
      setLoading(false);
      return;
    }

    // Then, get all unique author IDs
    const authorIds = Array.from(
      new Set(commentsData?.map((comment) => comment.author_id) || [])
    );

    if (authorIds.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    // Fetch author profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", authorIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      toast.error("Failed to load user profiles.");
      setLoading(false);
      return;
    }

    // Create a map of profiles by ID
    const profileMap = (profilesData || []).reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>);

    // Combine comments with author data
    const commentsWithAuthors = (commentsData || []).map((comment) => ({
      ...comment,
      author: profileMap[comment.author_id] || {
        username: "Unknown User",
        avatar_url: "",
      },
    }));

    const nestedComments = nestComments(commentsWithAuthors);
    setComments(nestedComments);
    setLoading(false);
  };

  const nestComments = (commentList: any[]): CommentType[] => {
    const commentMap: { [key: string]: CommentType } = {};
    commentList.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    const nested: CommentType[] = [];
    commentList.forEach((comment) => {
      if (comment.parent_id && commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].replies?.push(commentMap[comment.id]);
      } else {
        nested.push(commentMap[comment.id]);
      }
    });
    return nested;
  };

  const handleAddComment = (newComment: CommentType) => {
    // Optimistically add comment to UI
    const newCommentWithProfile = {
      ...newComment,
      author: {
        username: user?.user_metadata.user_name || "User",
        avatar_url: user?.user_metadata.avatar_url || "",
      },
      replies: [],
    };

    if (newComment.parent_id) {
      setComments((prevComments) => {
        const addReply = (comments: CommentType[]): CommentType[] => {
          return comments.map((c) => {
            if (c.id === newComment.parent_id) {
              return {
                ...c,
                replies: [newCommentWithProfile, ...(c.replies || [])],
              };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: addReply(c.replies) };
            }
            return c;
          });
        };
        return addReply(prevComments);
      });
    } else {
      setComments((prevComments) => [newCommentWithProfile, ...prevComments]);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      toast.error("You must be signed in to delete comments");
      return;
    }

    try {
      // First, check if the user is the author of the comment
      const { data: commentData, error: commentError } = await supabase
        .from("comments")
        .select("author_id")
        .eq("id", commentId)
        .single();

      if (commentError) {
        console.error("Error checking comment ownership:", commentError);
        toast.error("Failed to verify comment ownership");
        return;
      }

      if (commentData.author_id !== user.id) {
        toast.error("You can only delete your own comments");
        return;
      }

      // Delete all replies first (if any)
      const { error: repliesDeleteError } = await supabase
        .from("comments")
        .delete()
        .eq("parent_id", commentId);

      if (repliesDeleteError) {
        console.error("Error deleting replies:", repliesDeleteError);
        toast.error("Failed to delete comment replies");
        return;
      }

      // Then delete the main comment
      const { error: deleteError } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (deleteError) {
        console.error("Error deleting comment:", deleteError);
        toast.error("Failed to delete comment");
        return;
      }

      // Remove comment from UI
      setComments((prevComments) => {
        const removeComment = (comments: CommentType[]): CommentType[] => {
          return comments
            .filter((c) => c.id !== commentId)
            .map((c) => ({
              ...c,
              replies: c.replies ? removeComment(c.replies) : [],
            }));
        };
        return removeComment(prevComments);
      });

      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-8 gradient-text">Comments</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold gradient-text">
          Comments ({totalComments})
        </h2>
      </div>

      {user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AddComment postId={postId} onCommentAdded={handleAddComment} />
        </motion.div>
      )}

      {!user && (
        <div className="glass rounded-lg p-6 text-center mb-8">
          <p className="text-muted-foreground">
            Please <Link href="/auth/signin" className="text-primary hover:underline">sign in</Link> to leave a comment
          </p>
        </div>
      )}

      <div className="space-y-4 mt-8">
        {comments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 glass rounded-lg"
          >
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No comments yet</h3>
            <p className="text-muted-foreground">
              Be the first to share your thoughts!
            </p>
          </motion.div>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Comment
                comment={comment}
                postId={postId}
                onReplyAdded={handleAddComment}
                onCommentDeleted={handleDeleteComment}
                currentUserId={user?.id}
              />
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
