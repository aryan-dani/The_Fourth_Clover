"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/features/auth/auth-context";
import {
  createPost,
  updatePost,
  getPost,
  deletePost,
} from "@/features/data/database-operations";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { calculateReadTime } from "@/lib/utils";
import { postSchema } from "@/lib/validations";

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function coverExt(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

type PostFormValues = z.infer<typeof postSchema>;

function buildTags(tags: string | undefined) {
  return tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
}

export function useMutatePost(postId?: string) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | undefined>(postId);

  const createdPostIdRef = useRef<string | null>(null);
  const saveInFlightRef = useRef(false);
  const publishedAtRef = useRef<string | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);
  userIdRef.current = user?.id;

  const form = useForm<PostFormValues>({
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

  useEffect(() => {
    if (postId) {
      setEditingPostId(postId);
    } else if (!createdPostIdRef.current) {
      setEditingPostId(undefined);
      publishedAtRef.current = null;
    }
  }, [postId]);

  const loadPostForEdit = useCallback(async () => {
    if (!postId) return;
    // First autosave just set ?edit= — do not wipe in-progress form state.
    if (postId === createdPostIdRef.current) return;

    try {
      const { data, error } = await getPost(postId);
      if (error) throw error;
      if (!data) return;

      const authorId = userIdRef.current;
      if (authorId && data.author_id !== authorId) {
        toast.error("You don't have access to this post.");
        router.push("/dashboard");
        return;
      }

      publishedAtRef.current = data.published_at || null;
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
    } catch (error) {
      console.error("Error loading post:", error);
      toast.error("Failed to load post data.");
    }
  }, [postId, form, router]);

  useEffect(() => {
    if (postId) {
      void loadPostForEdit();
    }
  }, [postId, loadPostForEdit]);

  const syncEditUrl = (id: string) => {
    const newUrl = `/write?edit=${id}`;
    window.history.replaceState(
      { ...window.history.state, as: newUrl, url: newUrl },
      "",
      newUrl,
    );
  };

  const handleFormSubmit = async (values: PostFormValues) => {
    const authorId = userIdRef.current;
    if (!authorId) {
      toast.error("You must be logged in to create or update a post.");
      return;
    }
    if (saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    setIsLoading(true);
    setSubmissionMessage("");

    try {
      const read_time = calculateReadTime(values.content);
      const tagsArray = buildTags(values.tags);
      const currentPostId = postId || createdPostIdRef.current || editingPostId;

      const basePayload = {
        title: values.title,
        content: values.content,
        status: values.status,
        cover_image: values.cover_image || null,
        excerpt: values.excerpt || null,
        tags: tagsArray,
        read_time,
        slug: values.slug,
        featured_image: values.featured_image || null,
        scheduled_at: values.scheduled_at || null,
        published_at:
          values.status === "published"
            ? (publishedAtRef.current ?? new Date().toISOString())
            : null,
      };

      let result;
      if (currentPostId) {
        result = await updatePost(currentPostId, basePayload);
        toast.success(
          values.status === "published"
            ? "Post updated successfully!"
            : "Draft saved.",
        );
      } else {
        result = await createPost({
          ...basePayload,
          author_id: authorId,
        });
        toast.success(
          values.status === "published"
            ? "Post published successfully!"
            : "Draft saved.",
        );
      }

      if (result.error) throw result.error;

      if (result.data?.published_at) {
        publishedAtRef.current = result.data.published_at;
      } else if (values.status === "draft") {
        publishedAtRef.current = null;
      }

      if (result.data) {
        createdPostIdRef.current = result.data.id;
        setEditingPostId(result.data.id);

        if (result.data.status === "published") {
          router.push(`/post/${result.data.slug}`);
        } else {
          syncEditUrl(result.data.id);
        }
      }
    } catch (error: unknown) {
      console.error("Error submitting post:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(`Error: ${message}`);
    } finally {
      setIsLoading(false);
      saveInFlightRef.current = false;
    }
  };

  const saveDraft = useCallback(
    async (values: PostFormValues) => {
      const authorId = userIdRef.current;
      if (!authorId) return null;
      if (saveInFlightRef.current) return null;

      saveInFlightRef.current = true;
      try {
        const read_time = calculateReadTime(values.content);
        const tagsArray = buildTags(values.tags);
        const currentPostId =
          postId || createdPostIdRef.current || editingPostId;

        const basePayload = {
          title: values.title,
          content: values.content,
          status: values.status,
          cover_image: values.cover_image || null,
          excerpt: values.excerpt || null,
          tags: tagsArray,
          read_time,
          slug: values.slug,
          featured_image: values.featured_image || null,
          scheduled_at: values.scheduled_at || null,
          published_at:
            values.status === "draft"
              ? null
              : (publishedAtRef.current ?? new Date().toISOString()),
        };

        let result;
        if (currentPostId) {
          result = await updatePost(currentPostId, basePayload);
        } else {
          result = await createPost({
            ...basePayload,
            author_id: authorId,
          });
          if (result.data) {
            createdPostIdRef.current = result.data.id;
            setEditingPostId(result.data.id);
          }
        }

        if (result.error) throw result.error;

        if (result.data?.published_at) {
          publishedAtRef.current = result.data.published_at;
        } else if (values.status === "draft") {
          publishedAtRef.current = null;
        }

        if (!currentPostId && result.data) {
          syncEditUrl(result.data.id);
        }

        return result.data;
      } catch (error: unknown) {
        console.error("Error auto-saving post:", error);
        return null;
      } finally {
        saveInFlightRef.current = false;
      }
    },
    [postId, editingPostId],
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await deletePost(id);
      if (error) throw error;
      toast.success("Post deleted successfully.");
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Error deleting post:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(`Error: ${message}`);
    }
  };

  const handleImageUpload = async (file: File) => {
    const authorId = userIdRef.current;
    if (!authorId) {
      toast.error("You must be logged in to upload images.");
      return;
    }

    if (!ALLOWED_COVER_TYPES.has(file.type)) {
      toast.error("Use a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${authorId}/${Date.now()}.${coverExt(file.type)}`;
      const { data, error } = await supabase.storage
        .from("post-images")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(data.path);

      form.setValue("cover_image", publicUrlData.publicUrl, {
        shouldDirty: true,
      });
      toast.success("Image uploaded successfully!");
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      const message =
        error instanceof Error ? error.message : "Upload failed";
      toast.error(`Image upload failed: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    form,
    isLoading,
    isUploading,
    submissionMessage,
    editingPostId,
    handleFormSubmit,
    handleDelete,
    handleImageUpload,
    saveDraft,
  };
}
