"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { EditorShell } from "@/features/editor/EditorShell";
import { EditorCanvas } from "@/features/editor/EditorCanvas";
import { EditorSettingsSheet } from "@/features/editor/EditorSettingsSheet";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { useMutatePost } from "@/hooks/useMutatePost";
import { notifyEditorsOfReviewSubmissionAction } from "@/features/data/server-actions";
import { generateSlug } from "@/lib/utils";
import { toast } from "sonner";
import type { PublicationRole } from "@/types/database";

export type WriteClientProps = {
  publicationId?: string | null;
  publicationSlug?: string | null;
  publicationName?: string | null;
  memberRole?: PublicationRole | null;
};

function WritePageContent({
  publicationId,
  publicationSlug,
  publicationName,
  memberRole,
}: WriteClientProps) {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmittedForReview = useCallback(
    async (postId: string, postTitle: string) => {
      await notifyEditorsOfReviewSubmissionAction(postId, postTitle);
    },
    [],
  );

  const {
    form,
    isLoading,
    isUploading,
    isInlineUploading,
    submissionMessage,
    editingPostId,
    reviewNote,
    effectivePublicationId,
    handleFormSubmit,
    handleImageUpload,
    uploadInlineImage,
    saveDraft,
  } = useMutatePost(editId || undefined, {
    publicationId,
    publicationSlug,
    memberRole,
    onSubmittedForReview: handleSubmittedForReview,
  });

  const isPublicationMode = Boolean(
    effectivePublicationId || publicationId || publicationSlug,
  );
  const resolvedPubSlug =
    publicationSlug || (isPublicationMode ? "csi" : null);
  const resolvedPubName =
    publicationName || (isPublicationMode ? "CSI Tech Blog" : null);
  const canDirectPublish = !isPublicationMode || memberRole === "editor";
  const isJournal = !isPublicationMode;

  const {
    title,
    content,
    tags: tagsString,
    status,
    excerpt,
    slug,
    cover_image,
    format,
  } = form.watch();

  useEffect(() => {
    if (!editingPostId && title) {
      const nextSlug = generateSlug(title);
      const currentSlug = form.getValues("slug");
      if (
        !currentSlug ||
        (currentSlug !== nextSlug && !form.getFieldState("slug").isDirty)
      ) {
        form.setValue("slug", nextSlug, { shouldValidate: true });
      }
    }
  }, [title, editingPostId, form]);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedValuesRef = useRef<unknown>(null);
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (isLoading || isUploading || isInlineUploading) return;

    const hasContent = Boolean(title?.trim() || content?.trim());
    if (!hasContent) return;

    autoSaveTimerRef.current = setTimeout(async () => {
      const values = formRef.current.getValues();
      const currentJson = JSON.stringify(values);
      const lastJson = JSON.stringify(lastSavedValuesRef.current);

      if (currentJson === lastJson) return;

      setIsAutoSaving(true);
      const saved = await saveDraft(values);
      if (saved) {
        lastSavedValuesRef.current = values;
        setLastSaved(new Date());
        toast.success(
          values.status === "published" ? "Saved" : "Draft saved",
          { duration: 2000, id: "autosave" },
        );
      }
      setIsAutoSaving(false);
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    title,
    content,
    slug,
    tagsString,
    cover_image,
    excerpt,
    status,
    format,
    isLoading,
    isUploading,
    isInlineUploading,
    saveDraft,
  ]);

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleImageUpload(file);
    }
    event.target.value = "";
  };

  const handleInlineImagePick = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const url = await uploadInlineImage(file);
    if (!url) return;
    const snippet = `\n\n![Image](${url})\n\n`;
    form.setValue("content", `${form.getValues("content") || ""}${snippet}`, {
      shouldDirty: true,
    });
  };

  const submitDraft = () => {
    form.setValue("status", "draft");
    void form.handleSubmit(handleFormSubmit)();
  };

  const submitForReview = () => {
    form.setValue("status", "in_review");
    void form.handleSubmit(handleFormSubmit)();
  };

  const submitPublished = () => {
    form.setValue("status", "published");
    void form.handleSubmit(handleFormSubmit)();
  };

  const saveStatus = isAutoSaving
    ? "Saving…"
    : lastSaved
      ? `Saved ${lastSaved.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`
      : status === "published"
        ? "Live"
        : status === "in_review"
          ? "In review"
          : "Draft";

  const backHref = resolvedPubSlug ? `/${resolvedPubSlug}` : "/dashboard";
  const backLabel = resolvedPubSlug
    ? `Back to ${resolvedPubName || "publication"}`
    : "Back to dashboard";

  const primaryAction =
    status === "published"
      ? {
          label: "Update",
          onClick: () => void submitPublished(),
          disabled: isLoading,
          loading: isLoading,
        }
      : isPublicationMode && !canDirectPublish
        ? {
            label:
              status === "in_review" ? "Update submission" : "Submit",
            onClick: () => void submitForReview(),
            disabled: isLoading,
            loading: isLoading,
          }
        : {
            label: "Publish",
            onClick: () => void submitPublished(),
            disabled: isLoading,
            loading: isLoading,
          };

  const secondaryAction =
    status !== "published"
      ? {
          label: "Save draft",
          onClick: () => void submitDraft(),
          disabled: isLoading,
          loading: false,
        }
      : undefined;

  return (
    <Form {...form}>
      <EditorShell
        backHref={backHref}
        backLabel={backLabel}
        saveStatus={saveStatus}
        mode={mode}
        onModeChange={setMode}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        settingsTrigger={
          <EditorSettingsSheet
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            coverImage={cover_image || ""}
            onCoverFileChange={handleImageFileChange}
            onClearCover={() =>
              form.setValue("cover_image", "", { shouldDirty: true })
            }
            isUploadingCover={isUploading}
            tags={tagsString || ""}
            onTagsChange={(v) =>
              form.setValue("tags", v, { shouldDirty: true })
            }
            excerpt={excerpt || ""}
            onExcerptChange={(v) =>
              form.setValue("excerpt", v, { shouldDirty: true })
            }
            slug={slug || ""}
            onSlugChange={(v) =>
              form.setValue("slug", v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            showFormat={isJournal}
            format={format === "poetry" ? "poetry" : "prose"}
            onFormatChange={(v) =>
              form.setValue("format", v, { shouldDirty: true })
            }
          />
        }
        banner={
          reviewNote || submissionMessage ? (
            <div className="space-y-2">
              {reviewNote && (
                <div className="border border-border px-4 py-3 text-xs">
                  <p className="font-medium text-foreground">Editorial note</p>
                  <p className="mt-1 text-muted-foreground">{reviewNote}</p>
                </div>
              )}
              {submissionMessage && (
                <div className="border border-destructive/40 px-4 py-3 text-xs text-destructive">
                  {submissionMessage}
                </div>
              )}
            </div>
          ) : null
        }
      >
        <input
          ref={inlineInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => void handleInlineImagePick(e)}
          className="hidden"
        />

        <EditorCanvas
          title={title || ""}
          onTitleChange={(v) =>
            form.setValue("title", v, { shouldDirty: true })
          }
          content={content || ""}
          onContentChange={(v) =>
            form.setValue("content", v, { shouldDirty: true })
          }
          showDek={false}
          mode={mode}
          onImageInsert={() => {
            if (!isInlineUploading) inlineInputRef.current?.click();
          }}
          preview={
            <div className="space-y-4 p-5 sm:p-8">
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {title || "Untitled"}
              </h1>
              {content?.trim() ? (
                <PostBodyRenderer
                  content={content}
                  forceMarkdown
                  format={format === "poetry" ? "poetry" : "prose"}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing to preview yet.
                </p>
              )}
            </div>
          }
        />
      </EditorShell>
    </Form>
  );
}

export function WriteClient(props: WriteClientProps = {}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <WritePageContent {...props} />
    </Suspense>
  );
}
