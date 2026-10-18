"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { WriteToolbar } from "@/features/write/write-toolbar";
import { WriteEditorForm } from "@/features/write/write-editor-form";
import { WriteMetaFields } from "@/features/write/write-meta-fields";
import {
  WRITE_CHROME_INSET_CLASS,
  WRITE_EDITOR_AREA_PT_CLASS,
  WRITE_SIDEBAR_STICKY_TOP_CLASS,
} from "@/features/write/layout-classes";
import { useMutatePost } from "@/hooks/useMutatePost";
import { notifyEditorsOfReviewSubmissionAction } from "@/features/data/server-actions";
import {
  calculateReadTime,
  countContentWords,
  generateSlug,
  cn,
} from "@/lib/utils";
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

  const [tagInput, setTagInput] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const {
    title,
    content,
    tags: tagsString,
    status,
    excerpt,
    slug,
    cover_image,
  } = form.watch();

  const tags = tagsString
    ? tagsString
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [];

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

    // Pause autosave while an explicit Save/Publish or image upload is in flight.
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

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      form.setValue("tags", [...tags, tag].join(", "), { shouldDirty: true });
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      tags.filter((tag: string) => tag !== tagToRemove).join(", "),
      { shouldDirty: true },
    );
  };

  const wordCount = countContentWords(content || "");
  const readTime = calculateReadTime(content || "");

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

  const expandMoreInitially = Boolean(excerpt && excerpt.length > 0);

  const metaProps = {
    form,
    tagInput,
    setTagInput,
    tags,
    addTag,
    removeTag,
    handleImageFileChange,
    isUploading,
  };

  return (
    <div className="relative min-h-screen bg-background">
      <Form {...form}>
        <WriteToolbar
          editId={editingPostId ?? editId}
          isAutoSaving={isAutoSaving}
          lastSaved={lastSaved}
          settingsOpen={settingsOpen}
          onSettingsOpenChange={setSettingsOpen}
          metaProps={metaProps}
          expandMoreInitially={expandMoreInitially}
          status={status}
          isLoading={isLoading}
          onSaveDraftClick={() => void submitDraft()}
          onPublishClick={() => void submitPublished()}
          onSubmitForReviewClick={() => void submitForReview()}
          publicationName={resolvedPubName}
          publicationSlug={resolvedPubSlug}
          memberRole={memberRole}
        />

        <div
          className={cn(WRITE_EDITOR_AREA_PT_CLASS, WRITE_CHROME_INSET_CLASS)}
        >
          <div
            className={cn(
              "grid w-full max-w-[90rem] gap-10 lg:grid-cols-[minmax(0,1fr)_min(20rem,30vw)] lg:gap-12",
            )}
          >
            <WriteEditorForm
              form={form}
              onSubmit={form.handleSubmit(handleFormSubmit)}
              submissionMessage={submissionMessage}
              wordCount={wordCount}
              readTime={readTime}
              onUploadInlineImage={uploadInlineImage}
              isInlineUploading={isInlineUploading}
              reviewNote={reviewNote}
            />

            <aside className="hidden lg:block">
              <div className={cn(WRITE_SIDEBAR_STICKY_TOP_CLASS, "pb-8")}>
                <Card className="rounded-2xl border border-border/50 bg-card/[0.92] font-sans shadow-md ring-1 ring-border/25 backdrop-blur-sm dark:bg-card/80">
                  <CardHeader className="space-y-2 border-b border-border/40 bg-muted/[0.06] px-5 pb-4 pt-5">
                    <CardTitle className="!font-sans text-base font-semibold leading-tight tracking-tight text-foreground">
                      Post details
                    </CardTitle>
                    <p className="font-sans text-[12px] leading-relaxed text-muted-foreground">
                      Cover, slug, and tags. Excerpt is under{" "}
                      <span className="font-medium text-foreground/80">
                        More options
                      </span>
                      .
                    </p>
                  </CardHeader>
                  <CardContent className="px-5 pb-6 pt-5">
                    <WriteMetaFields
                      {...metaProps}
                      idPrefix="desk"
                      expandMoreInitially={expandMoreInitially}
                    />
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </Form>
    </div>
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
