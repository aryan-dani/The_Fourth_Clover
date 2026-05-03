"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import type * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth-context";
import {
  Save,
  Send,
  ArrowLeft,
  ImageIcon,
  Loader2,
  X,
  Clock,
  Calendar,
  Tag,
  FileText,
  Check,
  AlertCircle,
  Settings2,
  LetterText,
} from "lucide-react";
import Link from "next/link";
import { useMutatePost } from "@/hooks/useMutatePost";
import { calculateReadTime, generateSlug, cn } from "@/lib/utils";
import { toast } from "sonner";
import { postSchema } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type PostFormValues = z.infer<typeof postSchema>;

/* ------------------------------------------------------------------ */
/*  Settings panel sections                                           */
/* ------------------------------------------------------------------ */

function MetaSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h3 className="font-sans text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared meta fields (used in the slide-out settings panel)         */
/* ------------------------------------------------------------------ */

function WriteMetaFields({
  form,
  tagInput,
  setTagInput,
  tags,
  addTag,
  removeTag,
  handleImageFileChange,
  isUploading,
  idPrefix,
}: {
  form: UseFormReturn<PostFormValues>;
  tagInput: string;
  setTagInput: (v: string) => void;
  tags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  handleImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  idPrefix: string;
}) {
  const coverId = `cover-upload-${idPrefix}`;

  return (
    <div className="space-y-8">
      <MetaSection title="Cover & URL">
          <FormField
            control={form.control}
            name="cover_image"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-sans text-xs font-medium text-foreground/80">
                  Hero image
                </FormLabel>
                {field.value ? (
                  <div className="relative overflow-hidden rounded-xl border border-border/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={field.value}
                      alt="Cover"
                      className="h-28 w-full object-cover sm:h-32"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => form.setValue("cover_image", "")}
                      className="absolute right-2 top-2 rounded-lg text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/50 bg-muted/5 p-5 text-center transition-all hover:border-primary/30 hover:bg-muted/15">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      id={coverId}
                    />
                    <label htmlFor={coverId} className="block cursor-pointer">
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-xs">Uploading…</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                          <ImageIcon className="h-5 w-5 opacity-60" />
                          <span className="font-sans text-xs font-medium">
                            Add cover image
                          </span>
                          <span className="font-sans text-[11px] text-muted-foreground/60">
                            PNG, JPG
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-sans text-xs font-medium text-foreground/80">URL slug</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="your-post-slug"
                    className="h-9 rounded-lg font-mono text-xs"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
      </MetaSection>

      <MetaSection title="Publishing">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-sans text-xs font-medium text-foreground/80">Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduled_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-sans text-xs font-medium text-foreground/80">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  Schedule
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="datetime-local"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().slice(0, 16)
                          : ""
                      }
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => {
                        field.onChange(
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null
                        );
                      }}
                      className="h-9 min-w-0 flex-1 rounded-lg text-sm"
                    />
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-lg"
                        onClick={() => field.onChange(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
      </MetaSection>

      <MetaSection title="Discovery">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-sans text-xs font-medium text-foreground/80">
              <Tag className="h-3 w-3 text-muted-foreground" />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                    setTagInput("");
                  }
                }}
                className="h-9 min-w-0 flex-1 rounded-lg font-sans text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 shrink-0 rounded-lg font-sans text-xs"
                onClick={() => {
                  addTag(tagInput);
                  setTagInput("");
                }}
                disabled={!tagInput}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer gap-1 rounded-md py-0.5 pl-2 pr-1 font-sans text-xs font-normal hover:bg-destructive/15"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 opacity-70" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-sans text-xs font-medium text-foreground/80">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  Excerpt
                  <span className="font-normal text-muted-foreground/60">
                    · optional
                  </span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Appears in listings and previews…"
                    {...field}
                    rows={4}
                    maxLength={300}
                    className="min-h-[100px] resize-y rounded-lg font-sans text-sm leading-relaxed"
                  />
                </FormControl>
                <div className="text-right font-sans text-[11px] tabular-nums text-muted-foreground/50">
                  {(field.value || "").length}/300
                </div>
              </FormItem>
            )}
          />
      </MetaSection>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main write page content                                           */
/* ------------------------------------------------------------------ */

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { user, loading } = useAuth();

  const [tagInput, setTagInput] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    form,
    isLoading,
    isUploading,
    submissionMessage,
    handleFormSubmit,
    handleImageUpload,
    saveDraft,
  } = useMutatePost(editId || undefined);

  const {
    title,
    content,
    tags: tagsString,
    status,
    scheduled_at,
  } = form.watch();

  const tags = tagsString
    ? tagsString.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    if (!editId && title) {
      const slug = generateSlug(title);
      const currentSlug = form.getValues("slug");
      if (
        !currentSlug ||
        (currentSlug !== slug && !form.getFieldState("slug").isDirty)
      ) {
        form.setValue("slug", slug, { shouldValidate: true });
      }
    }
  }, [title, editId, form]);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValuesRef = useRef<unknown>(null);

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if ((title || content) && !isLoading && !isUploading) {
      autoSaveTimerRef.current = setTimeout(async () => {
        const values = form.getValues();
        const currentJson = JSON.stringify(values);
        const lastJson = JSON.stringify(lastSavedValuesRef.current);

        if (currentJson !== lastJson) {
          setIsAutoSaving(true);
          await saveDraft(values);
          lastSavedValuesRef.current = values;
          setLastSaved(new Date());
          setIsAutoSaving(false);
          toast.success("Draft saved", { duration: 2000, id: "autosave" });
        }
      }, 3000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, isLoading, isUploading, saveDraft, form]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user?.id, loading, router]);

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag].join(", ");
      form.setValue("tags", newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags
      .filter((tag: string) => tag !== tagToRemove)
      .join(", ");
    form.setValue("tags", newTags);
  };

  const wordCount = (content || "")
    .trim()
    .split(/\s+/)
    .filter((word: string) => word.length > 0).length;
  const readTime = calculateReadTime(content || "");

  const runSubmit = () => form.handleSubmit(handleFormSubmit)();

  if (!user) return null;

  const metaBase = {
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
        {/* ── Floating top toolbar (sheet meta fields need FormProvider) ── */}
        <div className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-3 px-3 sm:px-5">

          {/* Left: back + title */}
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm"
              asChild
            >
              <Link href="/dashboard" aria-label="Back to dashboard">
                <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </Link>
            </Button>

            <div className="flex min-w-0 items-center gap-2">
              <span className="text-lg leading-none" aria-hidden>🍀</span>
              <div className="hidden min-w-0 flex-col sm:flex">
                <p className="truncate font-sans text-sm font-semibold tracking-tight text-foreground">
                  {editId ? "Editing" : "New draft"}
                </p>
              </div>
            </div>
          </div>

          {/* Center: auto-save status (subtle) */}
          <div className="hidden items-center gap-1.5 sm:flex">
            {isAutoSaving ? (
              <div className="flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-xl">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving…</span>
              </div>
            ) : lastSaved ? (
              <div className="flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-xl">
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="tabular-nums">
                  Saved {lastSaved.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-xl">
                <LetterText className="h-3 w-3 opacity-60" />
                <span>Autosaves when you pause</span>
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle />

            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3"
                >
                  <Settings2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  <span className="hidden font-sans text-xs sm:inline">Settings</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-full flex-col overflow-y-auto rounded-l-3xl border-l border-border/50 bg-background p-0 sm:max-w-md"
              >
                <SheetHeader className="border-b border-border/40 px-6 py-5">
                  <SheetTitle className="font-sans text-base font-semibold">
                    Post settings
                  </SheetTitle>
                  <SheetDescription className="font-sans text-xs text-muted-foreground/70">
                    Cover, slug, tags, scheduling, and excerpt.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <WriteMetaFields {...metaBase} idPrefix="settings" />
                </div>
              </SheetContent>
            </Sheet>

            {/* Primary action: Save / Publish */}
            <Button
              type="button"
              size="sm"
              className="h-9 gap-2 rounded-full px-4 font-sans text-sm shadow-sm"
              disabled={isLoading}
              onClick={() => void runSubmit()}
            >
              {isLoading && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              )}
              {status === "draft" ? (
                <>
                  <Save className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Save</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{editId ? "Update" : "Publish"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Editor canvas ── */}
      <div className="pt-16">
          {/* Submission error */}
          {submissionMessage && (
            <div className="mx-auto w-full max-w-3xl px-5 pb-4">
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submissionMessage}</AlertDescription>
              </Alert>
            </div>
          )}

          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="mx-auto max-w-3xl px-5 pb-32 sm:px-8"
          >
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Title"
                      {...field}
                      className="h-auto border-0 bg-transparent p-0 font-sans text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/35 focus-visible:ring-0 sm:text-4xl md:text-[2.75rem]"
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <div className="mt-6">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Start writing. Markdown and plain text both work."
                        {...field}
                        className="min-h-[60vh] resize-y border-0 bg-transparent px-0 py-0 font-sans text-base leading-[1.8] text-foreground/90 shadow-none ring-0 placeholder:text-muted-foreground/35 focus-visible:ring-0 sm:min-h-[65vh] sm:text-lg sm:leading-[1.85]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bottom stats bar */}
            <div className="mt-8 flex flex-col gap-3 border-t border-border/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 font-sans text-xs text-muted-foreground/60">
                <span className="tabular-nums">{wordCount} words</span>
                <span className="h-3 w-px bg-border/30" aria-hidden />
                <span className="tabular-nums">{readTime} min read</span>
              </div>
              {scheduled_at && (
                <div className="flex items-center gap-1.5 text-xs text-primary">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-sans">
                    Scheduled: {new Date(scheduled_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </form>
      </div>
      </Form>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <WritePageContent />
    </Suspense>
  );
}
