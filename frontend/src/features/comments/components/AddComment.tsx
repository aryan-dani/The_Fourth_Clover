"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
interface AddCommentProps {
  postId: string;
  parentId?: string | null;
  onCommentAdded: (comment: any) => void;
}

export function AddComment({
  postId,
  parentId = null,
  onCommentAdded,
}: AddCommentProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    const newComment = {
      post_id: postId,
      author_id: user.id,
      content: content.trim(),
      parent_id: parentId,
    };

    const { data, error } = await supabase
      .from("comments")
      .insert(newComment)
      .select()
      .single();

    if (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment.");
    } else {
      toast.success("Comment posted!");
      setContent("");
      if (onCommentAdded) {
        onCommentAdded(data);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="space-y-4 p-4 pt-5 sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder={parentId ? "Write a reply…" : "Add a comment…"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="focus-ring min-h-[100px] resize-y font-serif text-[15px] sm:text-base"
          />
          <Button type="submit" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
