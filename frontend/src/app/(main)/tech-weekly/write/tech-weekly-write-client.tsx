"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  ImagePlus,
  Loader2,
  Lock,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { saveTechSubmissionAction } from "@/features/data/tech-weekly-actions";
import type {
  CsiRole,
  PlatformSettings,
  TechSubmissionWithAuthor,
  TechWeek,
} from "@/types/database";

type WriteContext = {
  authenticated: boolean;
  userId: string | null;
  role: CsiRole;
  csiId: number | null;
  dept: string | null;
  year: string | null;
  canWrite: boolean;
  currentWeek: TechWeek | null;
  isWindowOpen: boolean;
  settings: PlatformSettings;
  editingSubmission: TechSubmissionWithAuthor | null;
  myWeekSubmissions: TechSubmissionWithAuthor[];
};

const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function countWords(text: string): number {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return 0;
  return trimmed.split(" ").length;
}

export default function TechWeeklyWriteClient({
  initialContext,
}: {
  initialContext: WriteContext;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const existing = initialContext.editingSubmission;
  const storageKey = useMemo(
    () =>
      `csi-tech-weekly-draft:${initialContext.userId || "anon"}:${existing?.id || initialContext.currentWeek?.week_key || "current"}`,
    [initialContext.userId, existing?.id, initialContext.currentWeek?.week_key]
  );

  const [submissionId, setSubmissionId] = useState<string | null>(
    existing?.id || null
  );
  const [title, setTitle] = useState(existing?.title || "");
  const [summary, setSummary] = useState(existing?.summary || "");
  const [content, setContent] = useState(existing?.content || "");
  const [coverImage, setCoverImage] = useState(existing?.cover_image || "");
  const [tagsInput, setTagsInput] = useState(
    existing?.tags?.length ? existing.tags.join(", ") : "Engineering, System Design"
  );
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [savingStatus, setSavingStatus] = useState<
    "idle" | "saving_draft" | "submitting"
  >("idle");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [restoredFromLocal, setRestoredFromLocal] = useState(false);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  // Restore unsaved local draft if creating a new post
  useEffect(() => {
    if (existing) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        title?: string;
        summary?: string;
        content?: string;
        coverImage?: string;
        tagsInput?: string;
      };
      if (parsed.title || parsed.content) {
        setTitle(parsed.title || "");
        setSummary(parsed.summary || "");
        setContent(parsed.content || "");
        setCoverImage(parsed.coverImage || "");
        if (parsed.tagsInput) setTagsInput(parsed.tagsInput);
        setRestoredFromLocal(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, [existing, storageKey]);

  // Autosave to localStorage
  useEffect(() => {
    if (!initialContext.canWrite) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            title,
            summary,
            content,
            coverImage,
            tagsInput,
          })
        );
      } catch {
        // Ignore quota errors
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [title, summary, content, coverImage, tagsInput, storageKey, initialContext.canWrite]);

  const wordCount = useMemo(() => countWords(content), [content]);
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const parsedTags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8),
    [tagsInput]
  );

  const uploadImageFile = async (
    file: File,
    kind: "cover" | "inline"
  ): Promise<string | null> => {
    if (!initialContext.userId) return null;
    if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
      toast({
        title: "Unsupported image format",
        description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive",
      });
      return null;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast({
        title: "Image too large",
        description: "Maximum image size is 5 MB.",
        variant: "destructive",
      });
      return null;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
      ? ext
      : "jpg";
    const filePath = `${initialContext.userId}/tech-weekly-${kind}-${Date.now()}.${safeExt}`;

    const { error } = await supabase.storage
      .from("post-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload image.",
        variant: "destructive",
      });
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadImageFile(file, "cover");
      if (url) {
        setCoverImage(url);
        toast({
          title: "Cover image uploaded",
          description: "Your cover image has been attached.",
        });
      }
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInline(true);
    try {
      const url = await uploadImageFile(file, "inline");
      if (url) {
        const snippet = `\n\n![Diagram or screenshot](${url})\n\n`;
        setContent((prev) => `${prev}${snippet}`);
        toast({
          title: "Inline image inserted",
          description: "Markdown image tag added to the article body.",
        });
      }
    } finally {
      setUploadingInline(false);
      if (inlineInputRef.current) inlineInputRef.current.value = "";
    }
  };

  const handleSave = async (targetStatus: "draft" | "submitted") => {
    if (!initialContext.isWindowOpen && initialContext.role !== "super_admin") {
      toast({
        title: "Submission window closed",
        description:
          "Submissions are locked after Wednesday 09:00 IST while Technical Heads select the weekly LinkedIn pick.",
        variant: "destructive",
      });
      return;
    }

    setSavingStatus(
      targetStatus === "submitted" ? "submitting" : "saving_draft"
    );
    try {
      const res = await saveTechSubmissionAction({
        id: submissionId,
        title,
        summary,
        content,
        coverImage: coverImage || null,
        tags: parsedTags,
        status: targetStatus,
      });

      if (!res.success || !res.submission) {
        toast({
          title: "Could not save submission",
          description: res.error || "Please check your inputs and try again.",
          variant: "destructive",
        });
        return;
      }

      setSubmissionId(res.submission.id);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }

      toast({
        title:
          targetStatus === "submitted"
            ? "Submitted for CSI Tech Weekly!"
            : "Draft saved",
        description:
          targetStatus === "submitted"
            ? "Your article is now visible in the weekly feed and queued for Wednesday LinkedIn selection."
            : "Your draft was saved. You can submit it anytime before Wednesday 09:00 IST.",
      });

      if (targetStatus === "submitted") {
        router.push(`/tech-weekly/${res.submission.slug}`);
      } else {
        router.refresh();
      }
    } finally {
      setSavingStatus("idle");
    }
  };

  if (!initialContext.authenticated) {
    return (
      <div className="container max-w-3xl py-16">
        <div className="rounded-3xl border border-border/70 bg-card/90 p-8 text-center shadow-sm">
          <Lock className="mx-auto mb-4 h-10 w-10 text-emerald-500" />
          <h1 className="font-display text-2xl font-bold">
            Sign in with Google to write for CSI Tech Weekly
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only verified CSI MIT-WPU Technical team members can publish weekly
            engineering posts.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href="/auth/signin">Sign in with Google</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tech-weekly">Back to Tech Weekly</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (initialContext.role === "unverified") {
    return (
      <div className="container max-w-3xl py-16">
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-emerald-500" />
          <h1 className="font-display text-2xl font-bold">
            Verify Your CSI ID First
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Link your Google account with your CSI ID and 10-digit MIT-WPU PRN
            to unlock technical publishing.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href="/verify-csi">Verify CSI Identity</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tech-weekly">Browse Tech Weekly</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!initialContext.canWrite) {
    return (
      <div className="container max-w-3xl py-16">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
          <h1 className="font-display text-2xl font-bold">
            CSI Technical Team Publishing Only
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your CSI ID (#{initialContext.csiId} · {initialContext.dept || "Member"}) is
            verified for reading, reactions, and following. Publishing on CSI
            Tech Weekly is restricted to Technical department members.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/tech-weekly">Return to Tech Weekly Feed</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const wordTargetColor =
    wordCount > 2000
      ? "text-destructive font-semibold"
      : wordCount >= 150 && wordCount <= 350
        ? "text-emerald-500 font-semibold"
        : "text-muted-foreground";

  return (
    <LazyMotion features={domAnimation}>
      <div className="container max-w-5xl py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/tech-weekly"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to CSI Tech Weekly
            </Link>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {submissionId ? "Edit Weekly Submission" : "Write for CSI Tech Weekly"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {initialContext.currentWeek?.title || "Current Weekly Cycle"} · Verified as
              CSI #{initialContext.csiId} ({initialContext.dept || "Tech"}{" "}
              {initialContext.year ? `· ${initialContext.year}` : ""})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {initialContext.isWindowOpen ? (
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 px-3 py-1">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Window Open (Until Wed 09:00 IST)
              </Badge>
            ) : (
              <Badge variant="destructive" className="px-3 py-1">
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Cutoff Passed (Wed 09:00 IST)
              </Badge>
            )}
          </div>
        </div>

        {!initialContext.isWindowOpen && initialContext.role !== "super_admin" && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">
                Wednesday 09:00 IST Cutoff Reached
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                New submissions and edits for this week are now locked while Technical
                Heads Darshan (241) and Tanish (246) review and select the weekly
                LinkedIn feature. The next window opens Sunday at 00:00 IST.
              </p>
            </div>
          </div>
        )}

        {existing?.review_note && (
          <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4 text-sm">
            <p className="font-semibold text-sky-400">
              Reviewer Feedback ({existing.status.toUpperCase()}):
            </p>
            <p className="mt-1 text-muted-foreground">{existing.review_note}</p>
          </div>
        )}

        {restoredFromLocal && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-400 flex items-center justify-between">
            <span>Restored unsaved draft from your browser storage.</span>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(storageKey);
                setRestoredFromLocal(false);
              }}
              className="underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/70 bg-card/90 p-6 md:p-8 shadow-sm space-y-6"
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Article Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How Postgres MVCC Prevents Read Locks at Scale"
              className="text-lg font-semibold h-12"
              maxLength={200}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                LinkedIn Hook / Summary (1-2 sentences)
              </label>
              <Input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Concise takeaway used when CSI reposts to LinkedIn..."
                maxLength={400}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Technical Tags (comma-separated)
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Distributed Systems, AI, Next.js, Security"
              />
            </div>
          </div>

          {/* Cover Image & Inline Image Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
              >
                {uploadingCover ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-2 h-4 w-4 text-emerald-500" />
                )}
                {coverImage ? "Replace Cover Image" : "Upload Cover Image"}
              </Button>

              {coverImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCoverImage("")}
                  className="text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Remove Cover
                </Button>
              )}

              <input
                ref={inlineInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleInlineUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingInline}
                onClick={() => inlineInputRef.current?.click()}
              >
                {uploadingInline ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4 text-sky-500" />
                )}
                Insert Inline Diagram / Image
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={activeTab === "write" ? "default" : "ghost"}
                onClick={() => setActiveTab("write")}
              >
                <FileEdit className="mr-1.5 h-3.5 w-3.5" />
                Write Markdown
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === "preview" ? "default" : "ghost"}
                onClick={() => setActiveTab("preview")}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Preview
              </Button>
            </div>
          </div>

          {coverImage && (
            <div className="relative overflow-hidden rounded-2xl border border-border/60 max-h-60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-full h-56 object-cover"
              />
            </div>
          )}

          {activeTab === "write" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                  Markdown Body (Code blocks, lists, inline images supported)
                </span>
                <span className={wordTargetColor}>
                  {wordCount} words · ~{readTime} min read (150-300 words ideal for
                  LinkedIn · 2000 max)
                </span>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                placeholder={`## The Engineering Problem\nExplain the real-world bottleneck or concept clearly.\n\n\`\`\`ts\n// Include concise code snippets or architecture notes\n\`\`\`\n\n## Key Takeaway\nSummarize what engineers should remember.`}
                className="font-mono text-sm leading-relaxed"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-border/70 bg-background/60 p-6 space-y-4 min-h-[320px]">
              <h2 className="font-display text-2xl font-bold">
                {title || "Untitled Technical Post"}
              </h2>
              {summary && (
                <p className="text-sm text-muted-foreground italic">{summary}</p>
              )}
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                {content || "Nothing written yet."}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60">
            <div className="text-xs text-muted-foreground">
              {existing ? (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Current status:{" "}
                  <strong className="uppercase text-foreground">
                    {existing.status}
                  </strong>
                </span>
              ) : (
                <span>
                  Drafts are private until you click Submit for Wednesday Selection.
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={
                  savingStatus !== "idle" ||
                  (!initialContext.isWindowOpen &&
                    initialContext.role !== "super_admin")
                }
                onClick={() => handleSave("draft")}
              >
                {savingStatus === "saving_draft" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Draft
              </Button>

              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={
                  savingStatus !== "idle" ||
                  (!initialContext.isWindowOpen &&
                    initialContext.role !== "super_admin")
                }
                onClick={() => handleSave("submitted")}
              >
                {savingStatus === "submitting" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit for Wednesday Selection
              </Button>
            </div>
          </div>
        </m.div>
      </div>
    </LazyMotion>
  );
}
