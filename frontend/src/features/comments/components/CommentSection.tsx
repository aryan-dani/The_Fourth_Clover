"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CommentThread,
  type CommentNode,
} from "@/components/editorial/CommentThread";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";

type RawComment = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  post_id: string;
  parent_id: string | null;
};

function nestComments(
  rows: (RawComment & {
    author: { username: string; full_name?: string | null; avatar_url?: string | null };
  })[],
): CommentNode[] {
  const map: Record<string, CommentNode> = {};

  rows.forEach((row) => {
    map[row.id] = {
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      user_id: row.author_id,
      author: {
        username: row.author.username,
        fullName: row.author.full_name,
        avatarUrl: row.author.avatar_url,
      },
      replies: [],
    };
  });

  const roots: CommentNode[] = [];
  rows.forEach((row) => {
    const node = map[row.id];
    if (row.parent_id && map[row.parent_id]) {
      map[row.parent_id].replies = map[row.parent_id].replies || [];
      map[row.parent_id].replies!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function CommentSection({ postId }: { postId: string }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setLoading(true);

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

    const authorIds = Array.from(
      new Set((commentsData || []).map((c) => c.author_id)),
    );

    if (authorIds.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", authorIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      toast.error("Failed to load user profiles.");
      setLoading(false);
      return;
    }

    const profileMap = (profilesData || []).reduce(
      (acc, p) => {
        acc[p.id] = p;
        return acc;
      },
      {} as Record<
        string,
        { username: string; full_name?: string | null; avatar_url?: string | null }
      >,
    );

    const withAuthors = (commentsData || []).map((comment) => ({
      ...comment,
      author: profileMap[comment.author_id] || {
        username: "Unknown",
        full_name: null,
        avatar_url: null,
      },
    }));

    setComments(nestComments(withAuthors));
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const handleAdd = async (content: string, parentId?: string | null) => {
    if (!user) {
      toast.error("Sign in to comment.");
      throw new Error("Not signed in");
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment.");
      throw error || new Error("Failed to post");
    }

    const node: CommentNode = {
      id: data.id,
      content: data.content,
      created_at: data.created_at,
      user_id: data.author_id,
      author: {
        username: profile?.username || user.user_metadata?.user_name || "User",
        fullName: profile?.full_name || null,
        avatarUrl:
          profile?.avatar_url || user.user_metadata?.avatar_url || null,
      },
      replies: [],
    };

    setComments((prev) => {
      if (parentId) {
        const addReply = (nodes: CommentNode[]): CommentNode[] =>
          nodes.map((n) => {
            if (n.id === parentId) {
              return { ...n, replies: [...(n.replies || []), node] };
            }
            if (n.replies?.length) {
              return { ...n, replies: addReply(n.replies) };
            }
            return n;
          });
        return addReply(prev);
      }
      return [node, ...prev];
    });

    toast.success("Comment posted");
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast.error("You must be signed in to delete comments");
      throw new Error("Not signed in");
    }

    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .select("author_id")
      .eq("id", id)
      .single();

    if (commentError) {
      toast.error("Failed to verify comment ownership");
      throw commentError;
    }

    if (commentData.author_id !== user.id) {
      toast.error("You can only delete your own comments");
      throw new Error("Not owner");
    }

    const { error: repliesDeleteError } = await supabase
      .from("comments")
      .delete()
      .eq("parent_id", id);

    if (repliesDeleteError) {
      toast.error("Failed to delete comment replies");
      throw repliesDeleteError;
    }

    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", id);

    if (deleteError) {
      toast.error("Failed to delete comment");
      throw deleteError;
    }

    setComments((prev) => {
      const remove = (nodes: CommentNode[]): CommentNode[] =>
        nodes
          .filter((n) => n.id !== id)
          .map((n) => ({
            ...n,
            replies: n.replies ? remove(n.replies) : [],
          }));
      return remove(prev);
    });

    toast.success("Comment deleted");
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading comments">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse border-b border-hairline py-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/4 rounded bg-muted" />
                <div className="h-12 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <CommentThread
      comments={comments}
      canComment={Boolean(user)}
      currentUserId={user?.id}
      onAdd={handleAdd}
      onDelete={handleDelete}
    />
  );
}
