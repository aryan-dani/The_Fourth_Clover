"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
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
  Eye,
  FileText,
  Check,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { useMutatePost } from "@/hooks/useMutatePost";
import { calculateReadTime, generateSlug } from "@/lib/utils";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { user, loading } = useAuth();

  const [tagInput, setTagInput] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    cover_image,
    status,
    scheduled_at,
  } = form.watch();

  const tags = tagsString
    ? tagsString.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  // Auto-generate slug from title
  useEffect(() => {
    if (!editId && title) {
      const slug = generateSlug(title);
      const currentSlug = form.getValues("slug");
      if (!currentSlug || (currentSlug !== slug && !form.getFieldState("slug").isDirty)) {
        form.setValue("slug", slug, { shouldValidate: true });
      }
    }
  }, [title, editId, form]);

  // Autosave functionality
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValuesRef = useRef<any>(null);

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    const newTags = tags.filter((tag: string) => tag !== tagToRemove).join(", ");
    form.setValue("tags", newTags);
  };

  // Stats
  const wordCount = (content || "").trim().split(/\s+/).filter((word: string) => word.length > 0).length;
  const readTime = calculateReadTime(content || "");

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-14">
            {/* Left */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>

              <Separator orientation="vertical" className="h-5" />

              <span className="text-sm text-muted-foreground">
                {editId ? "Editing" : "New post"}
              </span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* Save Status */}
              <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
                {isAutoSaving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </>
                ) : lastSaved ? (
                  <>
                    <Check className="w-3 h-3 text-green-500" />
                    Saved
                  </>
                ) : null}
              </div>

              {/* Settings Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>

              {/* Main Action */}
              <Button
                onClick={form.handleSubmit(handleFormSubmit)}
                disabled={isLoading}
                size="sm"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {status === "draft" ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {editId ? "Update" : "Publish"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {submissionMessage && (
        <div className="container mx-auto px-4 max-w-4xl mt-4">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{submissionMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-4xl py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">

            {/* Settings Panel (Collapsible) */}
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-muted/30 rounded-lg p-6 border space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Post Settings</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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

                  {/* Schedule */}
                  <FormField
                    control={form.control}
                    name="scheduled_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          Schedule
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type="datetime-local"
                              value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                              min={new Date().toISOString().slice(0, 16)}
                              onChange={(e) => {
                                field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null);
                              }}
                              className="flex-1"
                            />
                            {field.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => field.onChange(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" />
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag and press Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(tagInput);
                          setTagInput("");
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
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
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 cursor-pointer hover:bg-destructive/10"
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <X className="w-3 h-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Excerpt */}
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        Excerpt
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief summary that appears in post previews..."
                          {...field}
                          rows={2}
                          maxLength={300}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground text-right">
                        {(field.value || "").length}/300
                      </div>
                    </FormItem>
                  )}
                />
              </motion.div>
            )}

            {/* Cover Image */}
            <FormField
              control={form.control}
              name="cover_image"
              render={({ field }) => (
                <FormItem>
                  {field.value ? (
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={field.value}
                        alt="Cover"
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => form.setValue("cover_image", "")}
                        className="absolute top-3 right-3"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                        id="coverUpload"
                      />
                      <label htmlFor="coverUpload" className="cursor-pointer block">
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span>Uploading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ImageIcon className="w-8 h-8" />
                            <span className="font-medium">Add a cover image</span>
                            <span className="text-xs">Click to upload or drag and drop</span>
                          </div>
                        )}
                      </label>
                    </div>
                  )}
                </FormItem>
              )}
            />

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
                      className="text-4xl font-bold border-none px-0 h-auto py-2 placeholder:text-muted-foreground/40 focus-visible:ring-0"
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Tell your story..."
                      {...field}
                      className="min-h-[60vh] text-lg leading-relaxed border-none px-0 resize-none placeholder:text-muted-foreground/40 focus-visible:ring-0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bottom Stats Bar */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-4">
                <span>{wordCount} words</span>
                <span>{readTime} min read</span>
              </div>
              {scheduled_at && (
                <div className="flex items-center gap-1.5 text-primary">
                  <Clock className="w-3.5 h-3.5" />
                  Scheduled for {new Date(scheduled_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </form>
        </Form>
      </div>
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
