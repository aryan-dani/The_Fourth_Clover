"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth-context";
import {
  createPost,
  updatePost,
  getPost,
  deletePost,
} from "@/lib/database-operations";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { calculateReadTime } from "@/lib/utils";
import { postSchema } from "../lib/validations";

export function useMutatePost(postId?: string) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const createdPostIdRef = useRef<string | null>(null);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      status: "draft",
      tags: "",
      cover_image: "",
      excerpt: "",
      slug: "",
      featured_image: null,
      scheduled_at: null,
    },
  });

  const loadPostForEdit = async () => {
    if (!postId) return;
    try {
      const { data, error } = await getPost(postId);
      if (error) throw error;
      if (data) {
        form.reset({
          title: data.title,
          content: data.content || "",
          status: data.status,
          tags: data.tags?.join(", ") || "",
          cover_image: data.cover_image || "",
          excerpt: data.excerpt || "",
          slug: data.slug,
          featured_image: data.featured_image || null,
          scheduled_at: data.scheduled_at || null,
        });
      }
    } catch (error) {
      console.error("Error loading post:", error);
      toast.error("Failed to load post data.");
    }
  };

  useEffect(() => {
    if (postId) {
      loadPostForEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleFormSubmit = async (values: z.infer<typeof postSchema>) => {
    if (!user) {
      toast.error("You must be logged in to create or update a post.");
      return;
    }

    setIsLoading(true);
    setSubmissionMessage("");

    try {
      const read_time = calculateReadTime(values.content);
      const tagsArray = values.tags
        ? values.tags.split(",").map((t: string) => t.trim())
        : [];

      const postPayload = {
        ...values,
        cover_image: values.cover_image || null,
        excerpt: values.excerpt || null,
        tags: tagsArray,
        read_time,
        author_id: user.id,
        published_at:
          values.status === "published" ? new Date().toISOString() : null,
        featured_image: values.featured_image || null,
        scheduled_at: values.scheduled_at || null,
      };

      let result;
      if (postId) {
        result = await updatePost(postId, postPayload);
        toast.success("Post updated successfully!");
      } else {
        result = await createPost(postPayload);
        toast.success("Post created successfully!");
      }

      if (result.error) throw result.error;

      if (result.data) {
        if (result.data.status === "published") {
          router.push(`/post/${result.data.slug}`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Error submitting post:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = async (values: z.infer<typeof postSchema>) => {
    if (!user) return null;

    try {
      const read_time = calculateReadTime(values.content);
      const tagsArray = values.tags
        ? values.tags.split(",").map((t: string) => t.trim())
        : [];

      const postPayload = {
        ...values,
        cover_image: values.cover_image || null,
        excerpt: values.excerpt || null,
        tags: tagsArray,
        read_time,
        author_id: user.id,
        // Don't update published_at for drafts
        published_at: null,
        featured_image: values.featured_image || null,
        scheduled_at: values.scheduled_at || null,
      };

      let result;
      const currentPostId = postId || createdPostIdRef.current;

      if (currentPostId) {
        result = await updatePost(currentPostId, postPayload);
      } else {
        result = await createPost(postPayload);
        if (result.data) {
          createdPostIdRef.current = result.data.id;
        }
      }

      if (result.error) throw result.error;

      // If we just created a new post as a draft, update the URL so subsequent saves are updates
      if (!currentPostId && result.data) {
        const newUrl = `/write?edit=${result.data.id}`;
        window.history.replaceState(
          { ...window.history.state, as: newUrl, url: newUrl },
          "",
          newUrl
        );
        // We also need to tell the form/hook that we now have an ID,
        // but since this hook relies on the prop passed in, we might need to reload or
        // let the parent handle the ID change.
        // For now, the router.replace/push might be safer to ensure state consistency.
        router.replace(newUrl);
      }

      return result.data;
    } catch (error: any) {
      console.error("Error auto-saving post:", error);
      return null;
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await deletePost(id);
      if (error) throw error;
      toast.success("Post deleted successfully.");
      // Refresh or redirect as needed
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) {
      toast.error("You must be logged in to upload images.");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("post-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(data.path);

      form.setValue("cover_image", publicUrlData.publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(`Image upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    form,
    isLoading,
    isUploading,
    submissionMessage,
    handleFormSubmit,
    handleDelete,
    handleImageUpload,
    saveDraft,
  };
}
