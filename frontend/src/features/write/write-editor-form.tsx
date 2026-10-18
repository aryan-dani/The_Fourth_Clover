"use client";

import { useState, useRef, useEffect } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ImagePlus,
  Eye,
  PenLine,
  Code2,
  Heading2,
  Heading3,
  Loader2,
  MessageSquareWarning,
  X,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { PostFormValues } from "@/features/write/write-meta-fields";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { inlineImageAltSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type QueuedInlineImage = {
  id: string;
  file: File;
  previewUrl: string;
  alt: string;
  error?: string;
};

type Props = {
  form: UseFormReturn<PostFormValues>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  submissionMessage: string;
  wordCount: number;
  readTime: number;
  onUploadInlineImage?: (file: File) => Promise<string | null>;
  isInlineUploading?: boolean;
  reviewNote?: string | null;
};

export function WriteEditorForm({
  form,
  onSubmit,
  submissionMessage,
  wordCount,
  readTime,
  onUploadInlineImage,
  isInlineUploading = false,
  reviewNote,
}: Props) {
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [queuedImages, setQueuedImages] = useState<QueuedInlineImage[]>([]);
  const [altDialogOpen, setAltDialogOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cursorSelectionRef = useRef<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  const titleValue = form.watch("title");
  const contentValue = form.watch("content");

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      queuedImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [queuedImages]);

  const recordCursorPosition = () => {
    const el = textareaRef.current;
    if (!el) return;
    cursorSelectionRef.current = {
      start: el.selectionStart ?? (contentValue || "").length,
      end: el.selectionEnd ?? (contentValue || "").length,
    };
  };

  const insertSnippetAtCursor = (snippet: string, cursorOffsetInside?: number) => {
    const current = form.getValues("content") || "";
    const el = textareaRef.current;
    const start = el
      ? (el.selectionStart ?? cursorSelectionRef.current.start)
      : cursorSelectionRef.current.start;
    const end = el
      ? (el.selectionEnd ?? cursorSelectionRef.current.end)
      : cursorSelectionRef.current.end;

    const safeStart = Math.min(Math.max(0, start), current.length);
    const safeEnd = Math.min(Math.max(safeStart, end), current.length);

    const nextContent =
      current.slice(0, safeStart) + snippet + current.slice(safeEnd);

    form.setValue("content", nextContent, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const nextPos =
      cursorOffsetInside !== undefined
        ? safeStart + cursorOffsetInside
        : safeStart + snippet.length;
    cursorSelectionRef.current = { start: nextPos, end: nextPos };

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    });
  };

  const queueFilesForAltPrompt = (files: FileList | File[]) => {
    if (!onUploadInlineImage) return;
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (fileArray.length === 0) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP, or GIF).");
      return;
    }

    recordCursorPosition();

    const items: QueuedInlineImage[] = fileArray.map((file, idx) => {
      const defaultAlt = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
      return {
        id: `${Date.now()}-${idx}`,
        file,
        previewUrl: URL.createObjectURL(file),
        alt: defaultAlt.length >= 2 ? defaultAlt : "",
      };
    });

    setQueuedImages(items);
    setAltDialogOpen(true);
  };

  const handleInlineFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      queueFilesForAltPrompt(e.target.files);
    }
    e.target.value = "";
  };

  const handleTextareaPaste = (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    if (!onUploadInlineImage) return;
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      const hasImage = Array.from(files).some((f) =>
        f.type.startsWith("image/"),
      );
      if (hasImage) {
        e.preventDefault();
        queueFilesForAltPrompt(files);
      }
    }
  };

  const handleTextareaDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    setIsDraggingOver(false);
    if (!onUploadInlineImage) return;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const hasImage = Array.from(files).some((f) =>
        f.type.startsWith("image/"),
      );
      if (hasImage) {
        e.preventDefault();
        queueFilesForAltPrompt(files);
      }
    }
  };

  const closeAltDialog = () => {
    queuedImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setQueuedImages([]);
    setAltDialogOpen(false);
  };

  const handleConfirmInlineUploads = async () => {
    if (!onUploadInlineImage || queuedImages.length === 0) return;

    let hasValidationError = false;
    const validated = queuedImages.map((item) => {
      const parsed = inlineImageAltSchema.safeParse({ alt: item.alt });
      if (!parsed.success) {
        hasValidationError = true;
        return {
          ...item,
          error: parsed.error.issues[0]?.message || "Alt text is required",
        };
      }
      return { ...item, alt: parsed.data.alt, error: undefined };
    });

    if (hasValidationError) {
      setQueuedImages(validated);
      return;
    }

    const markdownLines: string[] = [];
    for (const item of validated) {
      const uploadedUrl = await onUploadInlineImage(item.file);
      if (uploadedUrl) {
        const safeAlt = item.alt.replace(/[[\]]/g, "");
        markdownLines.push(`![${safeAlt}](${uploadedUrl})`);
      }
    }

    if (markdownLines.length > 0) {
      const prefix =
        cursorSelectionRef.current.start > 0 ? "\n\n" : "";
      insertSnippetAtCursor(`${prefix}${markdownLines.join("\n\n")}\n\n`);
      toast.success(
        markdownLines.length === 1
          ? "Inline image inserted!"
          : `${markdownLines.length} inline images inserted!`,
      );
    }

    closeAltDialog();
  };

  return (
    <>
      {reviewNote && (
        <div className="w-full max-w-[65ch] pb-4">
          <Alert className="rounded-xl border-amber-500/40 bg-amber-500/10 text-foreground">
            <MessageSquareWarning className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-sans text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Changes requested by editor
            </AlertTitle>
            <AlertDescription className="mt-1 font-sans text-sm text-foreground/90">
              {reviewNote}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {submissionMessage && (
        <div className="w-full max-w-[65ch] pb-4">
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submissionMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="w-full max-w-[65ch] pb-28 lg:pb-32"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Title"
                  {...field}
                  className="font-display h-auto border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0 sm:text-4xl md:text-[2.65rem]"
                  maxLength={100}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Editor Mode Toggle & Formatting Bar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-y border-border/40 py-2">
          <div
            className="inline-flex items-center rounded-full border border-border/60 bg-muted/35 p-0.5"
            role="tablist"
            aria-label="Editor view mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={editorMode === "write"}
              onClick={() => setEditorMode("write")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs font-medium transition-colors",
                editorMode === "write"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <PenLine className="h-3.5 w-3.5" />
              Write
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={editorMode === "preview"}
              onClick={() => setEditorMode("preview")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs font-medium transition-colors",
                editorMode === "preview"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          </div>

          {editorMode === "write" && (
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 font-sans text-xs text-muted-foreground hover:text-foreground"
                onClick={() => insertSnippetAtCursor("\n## Heading\n", 4)}
                title="Insert H2 heading"
                aria-label="Insert H2 heading"
              >
                <Heading2 className="mr-1 h-3.5 w-3.5" />
                H2
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 font-sans text-xs text-muted-foreground hover:text-foreground"
                onClick={() => insertSnippetAtCursor("\n### Subheading\n", 5)}
                title="Insert H3 subheading"
                aria-label="Insert H3 subheading"
              >
                <Heading3 className="mr-1 h-3.5 w-3.5" />
                H3
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 font-sans text-xs text-muted-foreground hover:text-foreground"
                onClick={() =>
                  insertSnippetAtCursor("\n```ts\n// code here\n```\n", 7)
                }
                title="Insert code block"
                aria-label="Insert code block"
              >
                <Code2 className="mr-1 h-3.5 w-3.5" />
                Code
              </Button>

              {onUploadInlineImage && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleInlineFileInputChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isInlineUploading}
                    className="h-8 gap-1.5 rounded-full border-border/70 px-3 font-sans text-xs font-medium"
                    onClick={() => {
                      recordCursorPosition();
                      fileInputRef.current?.click();
                    }}
                  >
                    {isInlineUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5" />
                    )}
                    <span>Insert image</span>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-6">
          {editorMode === "write" ? (
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div
                      className={cn(
                        "relative rounded-xl transition-colors",
                        isDraggingOver &&
                          "ring-2 ring-primary/50 bg-primary/5 p-2",
                      )}
                    >
                      <Textarea
                        placeholder="Start writing in Markdown. Use headings (##), code blocks (```), or drag and paste images directly."
                        {...field}
                        ref={(el) => {
                          field.ref(el);
                          textareaRef.current = el;
                        }}
                        onSelect={recordCursorPosition}
                        onKeyUp={recordCursorPosition}
                        onClick={recordCursorPosition}
                        onPaste={handleTextareaPaste}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingOver(true);
                        }}
                        onDragLeave={() => setIsDraggingOver(false)}
                        onDrop={handleTextareaDrop}
                        className="min-h-[58vh] resize-none overflow-y-auto border-0 bg-transparent px-0 py-0 font-serif text-base leading-[1.82] text-foreground/90 shadow-none ring-0 placeholder:text-muted-foreground/30 focus-visible:ring-0 sm:min-h-[62vh] sm:text-[17px] sm:leading-[1.88]"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="min-h-[58vh] rounded-2xl border border-border/50 bg-card/40 p-5 sm:min-h-[62vh] sm:p-8">
              {titleValue?.trim() && (
                <h1 className="font-display mb-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {titleValue}
                </h1>
              )}
              {contentValue?.trim() ? (
                <PostBodyRenderer
                  content={contentValue}
                  forceMarkdown={true}
                  className="mb-0"
                />
              ) : (
                <p className="font-sans text-sm text-muted-foreground">
                  Nothing to preview yet. Switch to Write mode and add some
                  Markdown content or inline images.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-border/10 pt-4 font-sans text-[11px] tabular-nums tracking-wide text-muted-foreground/50">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span className="h-2.5 w-px bg-border/25" aria-hidden />
            <span>{readTime} min read</span>
          </div>
          <span className="hidden sm:inline">
            Markdown, GFM tables, code blocks, and inline images supported
          </span>
        </div>
      </form>

      {/* Accessible Alt Text Prompt Dialog for Inline Images */}
      <Dialog
        open={altDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isInlineUploading) closeAltDialog();
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Add Image Alt Text
            </DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              Provide descriptive alt text for screen readers before inserting
              each image into your post (max 5 MB per image).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {queuedImages.map((item, index) => (
              <div
                key={item.id}
                className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3"
              >
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.alt || "Selected preview"}
                    className="h-16 w-24 shrink-0 rounded-lg border border-border/50 object-cover bg-muted"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-xs font-medium text-foreground">
                      {item.file.name}
                    </p>
                    <p className="font-sans text-[11px] text-muted-foreground">
                      {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  {queuedImages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => {
                        URL.revokeObjectURL(item.previewUrl);
                        setQueuedImages((prev) =>
                          prev.filter((q) => q.id !== item.id),
                        );
                      }}
                      aria-label="Remove queued image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor={`inline-alt-${item.id}`}
                    className="font-sans text-xs font-medium"
                  >
                    Alt text (required)
                  </Label>
                  <Input
                    id={`inline-alt-${item.id}`}
                    autoFocus={index === 0}
                    placeholder="e.g. Architecture diagram of Kubernetes pod networking"
                    value={item.alt}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQueuedImages((prev) =>
                        prev.map((q) =>
                          q.id === item.id
                            ? { ...q, alt: val, error: undefined }
                            : q,
                        ),
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleConfirmInlineUploads();
                      }
                    }}
                    className="font-sans text-sm"
                  />
                  {item.error && (
                    <p className="font-sans text-xs text-destructive">
                      {item.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isInlineUploading}
              onClick={closeAltDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isInlineUploading}
              onClick={() => void handleConfirmInlineUploads()}
            >
              {isInlineUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload & Insert"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
