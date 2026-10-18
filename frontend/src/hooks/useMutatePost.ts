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
import type { PublicationRole } from "@/types/database";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function imageExt(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

type PostFormValues = z.infer<typeof postSchema>;

function buildTags(tags: string | undefined) {
  return tags
    ? tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [];
}

export type UseMutatePostOptions = {
  publicationId?: string | null;
  publicationSlug?: string | null;
  memberRole?: PublicationRole | null;
  onSubmittedForReview?: (postId: string, title: string) => Promise<void>;
};

export function useMutatePost(
  postId?: string,
  options?: UseMutatePostOptions,
) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isInlineUploading, setIsInlineUploading] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | undefined>(postId);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [loadedPublicationId, setLoadedPublicationId] = useState<string | null>(
    options?.publicationId ?? null,
  );

  const createdPostIdRef = useRef<string | null>(null);
  const saveInFlightRef = useRef(false);
  const publishedAtRef = useRef<string | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);
  userIdRef.current = user?.id;

  const effectivePublicationId =
    options?.publicationId ?? loadedPublicationId ?? null;
  const effectivePublicationSlug =
    options?.publicationSlug ?? (effectivePublicationId ? "csi" : null);

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
      publication_id: options?.publicationId ?? null,
    },
  });

  useEffect(() => {
    if (options?.publicationId) {
      setLoadedPublicationId(options.publicationId);
      form.setValue("publication_id", options.publicationId);
    }
  }, [options?.publicationId, form]);

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
    // First autosave just set ?edit= - do not wipe in-progress form state.
    if (postId === createdPostIdRef.current) return;

    try {
      const { data, error } = await getPost(postId);
      if (error) throw error;
      if (!data) return;

      const authorId = userIdRef.current;
      const isEditor = options?.memberRole === "editor";
      if (authorId && data.author_id !== authorId && !isEditor) {
        toast.error("You don't have access to this post.");
        router.push("/dashboard");
        return;
      }

      publishedAtRef.current = data.published_at || null;
      setReviewNote(data.review_note || null);
      if (data.publication_id) {
        setLoadedPublicationId(data.publication_id);
      }

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
        publication_id: data.publication_id ?? options?.publicationId ?? null,
      });
    } catch (error) {
      console.error("Error loading post:", error);
      toast.error("Failed to load post data.");
    }
  }, [postId, form, router, options?.memberRole, options?.publicationId]);

  useEffect(() => {
    if (postId) {
      void loadPostForEdit();
    }
  }, [postId, loadPostForEdit]);

  const syncEditUrl = useCallback(
    (id: string) => {
      if (typeof window === "undefined") return;
      const pathname = window.location.pathname;
      const basePath = pathname.startsWith("/csi/write")
        ? "/csi/write"
        : "/write";
      const params = new URLSearchParams(window.location.search);
      params.set("edit", id);
      const newUrl = `${basePath}?${params.toString()}`;
      window.history.replaceState(
        { ...window.history.state, as: newUrl, url: newUrl },
        "",
        newUrl,
      );
    },
    [],
  );

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
      const pubId =
        values.publication_id ?? effectivePublicationId ?? null;

      // Enforce writer role guard on client before sending to Supabase RLS
      let targetStatus = values.status;
      if (
        pubId &&
        targetStatus === "published" &&
        options?.memberRole === "writer"
      ) {
        targetStatus = "in_review";
      }

      const basePayload = {
        title: values.title,
        content: values.content,
        status: targetStatus,
        cover_image: values.cover_image || null,
        excerpt: values.excerpt || null,
        tags: tagsArray,
        read_time,
        slug: values.slug,
        featured_image: values.featured_image || null,
        scheduled_at: values.scheduled_at || null,
        publication_id: pubId,
        review_note: targetStatus === "in_review" ? null : reviewNote,
        published_at:
          targetStatus === "published"
            ? (publishedAtRef.current ?? new Date().toISOString())
            : null,
      };

      let result;
      if (currentPostId) {
        result = await updatePost(currentPostId, basePayload);
      } else {
        result = await createPost({
          ...basePayload,
          author_id: authorId,
        });
      }

      if (result.error) throw result.error;

      if (result.data?.published_at) {
        publishedAtRef.current = result.data.published_at;
      } else if (targetStatus !== "published") {
        publishedAtRef.current = null;
      }

      if (result.data) {
        createdPostIdRef.current = result.data.id;
        setEditingPostId(result.data.id);

        if (targetStatus === "in_review") {
          setReviewNote(null);
          if (options?.onSubmittedForReview) {
            await options.onSubmittedForReview(
              result.data.id,
              result.data.title,
            );
          }
          toast.success("Submitted for editor review!");
          syncEditUrl(result.data.id);
        } else if (result.data.status === "published") {
          toast.success(
            currentPostId
              ? "Post updated successfully!"
              : "Post published successfully!",
          );
          const targetRoute = pubId
            ? `/${effectivePublicationSlug || "csi"}/${result.data.slug}`
            : `/post/${result.data.slug}`;
          router.push(targetRoute);
        } else {
          toast.success("Draft saved.");
          syncEditUrl(result.data.id);
        }
      }
    } catch (error: unknown) {
      console.error("Error submitting post:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "message" in error &&
              typeof (error as { message: unknown }).message === "string"
            ? (error as { message: string }).message
            : "Something went wrong";
      setSubmissionMessage(message);
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
        const pubId =
          values.publication_id ?? effectivePublicationId ?? null;

        let safeStatus = values.status;
        if (
          pubId &&
          safeStatus === "published" &&
          options?.memberRole === "writer"
        ) {
          safeStatus = "draft";
        }

        const basePayload = {
          title: values.title,
          content: values.content,
          status: safeStatus,
          cover_image: values.cover_image || null,
          excerpt: values.excerpt || null,
          tags: tagsArray,
          read_time,
          slug: values.slug,
          featured_image: values.featured_image || null,
          scheduled_at: values.scheduled_at || null,
          publication_id: pubId,
          published_at:
            safeStatus === "published"
              ? (publishedAtRef.current ?? new Date().toISOString())
              : null,
        };

        let result;
        if (currentPostId) {
          result = await updatePost(currentPostId, basePayload);
        } else {
          result = await createPost({
            ...basePayload,
            review_note: null,
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
        } else if (safeStatus !== "published") {
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
    [
      postId,
      editingPostId,
      effectivePublicationId,
      options?.memberRole,
      syncEditUrl,
    ],
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

  const validateImageFile = (file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error("Use a JPEG, PNG, WebP, or GIF image.");
      return false;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return false;
    }
    return true;
  };

  const handleImageUpload = async (file: File) => {
    const authorId = userIdRef.current;
    if (!authorId) {
      toast.error("You must be logged in to upload images.");
      return;
    }
    if (!validateImageFile(file)) return;

    setIsUploading(true);
    try {
      const fileName = `${authorId}/${Date.now()}.${imageExt(file.type)}`;
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
      toast.success("Cover image uploaded!");
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(`Image upload failed: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadInlineImage = useCallback(
    async (file: File): Promise<string | null> => {
      const authorId = userIdRef.current;
      if (!authorId) {
        toast.error("You must be logged in to upload images.");
        return null;
      }
      if (!validateImageFile(file)) return null;

      setIsInlineUploading(true);
      try {
        const rand = Math.random().toString(36).slice(2, 8);
        const fileName = `${authorId}/inline/${Date.now()}-${rand}.${imageExt(file.type)}`;
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

        return publicUrlData.publicUrl;
      } catch (error: unknown) {
        console.error("Error uploading inline image:", error);
        const message =
          error instanceof Error ? error.message : "Upload failed";
        toast.error(`Inline image upload failed: ${message}`);
        return null;
      } finally {
        setIsInlineUploading(false);
      }
    },
    [],
  );

  return {
    form,
    isLoading,
    isUploading,
    isInlineUploading,
    submissionMessage,
    editingPostId,
    reviewNote,
    effectivePublicationId,
    handleFormSubmit,
    handleDelete,
    handleImageUpload,
    uploadInlineImage,
    saveDraft,
  };
}
