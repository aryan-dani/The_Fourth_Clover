"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { runAllTests } from "@/lib/debug-supabase";
import {
  Save,
  Send,
  ArrowLeft,
  Image,
  Tag,
  Eye,
  Loader2,
  X,
  Edit3,
  Upload,
} from "lucide-react";
import Link from "next/link";
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
  const [debugMode, setDebugMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

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
    excerpt,
    status,
  } = form.watch();
  const postData = form.getValues(); // Keep for other references if needed, or use destructured values

  const tags = tagsString
    ? tagsString
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [];

  // Auto-generate slug from title
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

  // Autosave functionality
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValuesRef = useRef<any>(null);

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Only autosave if we have a title OR content, and it's not already submitting
    // We check if title or content is present to avoid saving empty drafts initially
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
          toast.success("Draft autosaved", { duration: 2000, id: "autosave" });
        }
      }, 3000); // Autosave after 3 seconds of inactivity
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

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  };

  const handleAddTagClick = () => {
    addTag(tagInput);
    setTagInput("");
  };

  const runDebugTests = async () => {
    setDebugMode(true);
    try {
      const results = await runAllTests();
      const failedTests = Object.entries(results).filter(
        ([_, result]) => !result.success
      );
      if (failedTests.length === 0) {
        toast.success("🎉 All Supabase tests passed!");
      } else {
        toast.error(
          `❌ ${failedTests.length} tests failed. Check console for details.`
        );
      }
    } catch (error) {
      toast.error("Debug tests failed - check console");
    } finally {
      setDebugMode(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild className="ui-text">
              <Link href="/dashboard" className="flex items-center ui-text">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Edit3 className="w-5 h-5" />
              <h1 className="text-2xl font-bold brand-text">
                {!!editId ? "Edit Your Story" : "Write Your Story"}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Autosave Indicator */}
            <div className="text-xs text-muted-foreground mr-2">
              {isAutoSaving ? (
                <span className="flex items-center">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span>
                  Saved{" "}
                  {lastSaved.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}
            </div>

            <Button
              onClick={form.handleSubmit(handleFormSubmit)}
              disabled={isLoading}
              className="bg-foreground text-background hover:bg-foreground/90 ui-text"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              {status === "draft"
                ? "Save Draft"
                : !!editId
                ? "Update"
                : "Publish"}
            </Button>
          </div>
        </motion.div>

        {submissionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{submissionMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* 🔍 Debug Panel - Only show in development */}
        {process.env.NODE_ENV === "development" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-800 dark:text-yellow-200 text-sm flex items-center">
                  🔍 Debug Panel
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runDebugTests}
                    disabled={debugMode}
                    className="text-yellow-800 border-yellow-300"
                  >
                    {debugMode ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Supabase Connection"
                    )}
                  </Button>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Run this if you're experiencing publishing issues
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Main Editor */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="elegant-card">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Enter your story title..."
                                {...field}
                                className="text-2xl font-bold border-none p-0 placeholder:text-muted-foreground focus-visible:ring-0 content"
                                maxLength={100}
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1 ui-text">
                              {field.value.length}/100 characters
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cover_image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center space-x-2">
                              <Image className="w-4 h-4" />
                              <span>Cover Image</span>
                            </FormLabel>
                            <div className="mt-2 space-y-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageFileChange}
                                  className="hidden"
                                  id="imageUpload"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    document
                                      .getElementById("imageUpload")
                                      ?.click()
                                  }
                                  disabled={isUploading}
                                  className="ui-text"
                                >
                                  {isUploading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  {isUploading
                                    ? "Uploading..."
                                    : "Upload Image"}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  or paste URL
                                </span>
                              </div>
                              <FormControl>
                                <Input
                                  placeholder="https://images.pexels.com/your-image.jpg"
                                  {...field}
                                  className="focus-ring"
                                />
                              </FormControl>
                            </div>
                            {field.value && (
                              <div className="mt-3 rounded-lg overflow-hidden relative">
                                <img
                                  src={field.value}
                                  alt="Cover preview"
                                  className="w-full h-48 object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    form.setValue("cover_image", "")
                                  }
                                  className="absolute top-2 right-2 ui-text"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Tell your story..."
                                {...field}
                                className="min-h-[400px] border-none p-0 resize-none placeholder:text-muted-foreground focus-visible:ring-0 content"
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1 ui-text">
                              {field.value.length} characters
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="excerpt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Excerpt (optional)
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description of your post..."
                                {...field}
                                className="mt-2 max-h-24"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="elegant-card">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Tag className="w-4 h-4 mr-2" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Add tags..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleTagInputKeyPress}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={handleAddTagClick}>
                          Add
                        </Button>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="flex items-center space-x-1"
                            >
                              <span>{tag}</span>
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="elegant-card">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Eye className="w-4 h-4 mr-2" />
                      Post Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Words:</span>
                        <span>
                          {
                            (content || "")
                              .trim()
                              .split(/\s+/)
                              .filter((word: string) => word.length > 0).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Characters:
                        </span>
                        <span>{(content || "").length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Read time:
                        </span>
                        <span>{calculateReadTime(content || "")}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <select {...field} className="bg-transparent">
                                  <option value="draft">Draft</option>
                                  <option value="published">Published</option>
                                </select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      {!!editId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mode:</span>
                          <Badge variant="outline">Editing</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <WritePageContent />
    </Suspense>
  );
}
