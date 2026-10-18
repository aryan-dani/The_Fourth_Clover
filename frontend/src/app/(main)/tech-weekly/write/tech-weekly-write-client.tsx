"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Code,
  Eye,
  FileEdit,
  Heading2,
  Heading3,
  ImagePlus,
  Loader2,
  Lock,
  Quote,
  Send,
  ShieldCheck,
  Terminal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
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
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const PRESET_TAGS = [
  "Distributed Systems",
  "Postgres",
  "AI Engineering",
  "System Design",
  "Security",
  "Compilers",
  "Frontend",
  "Cloud Native",
];

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
    existing?.tags?.length
      ? existing.tags.join(", ")
      : "System Design, Engineering"
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
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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
  }, [
    title,
    summary,
    content,
    coverImage,
    tagsInput,
    storageKey,
    initialContext.canWrite,
  ]);

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

  const togglePresetTag = (tag: string) => {
    const exists = parsedTags.some(
      (t) => t.toLowerCase() === tag.toLowerCase()
    );
    if (exists) {
      const next = parsedTags.filter(
        (t) => t.toLowerCase() !== tag.toLowerCase()
      );
      setTagsInput(next.join(", "));
    } else if (parsedTags.length < 8) {
      setTagsInput([...parsedTags, tag].join(", "));
    }
  };

  const insertMarkdownSnippet = (snippet: string) => {
    const el = bodyTextareaRef.current;
    if (!el) {
      setContent((prev) => `${prev}${snippet}`);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + snippet + content.slice(end);
    setContent(next);
    setTimeout(() => {
      el.focus();
      const cursor = start + snippet.length;
      el.setSelectionRange(cursor, cursor);
    }, 10);
  };

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
          title: "Cover artwork attached",
          description: "Your cover image is ready.",
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
        insertMarkdownSnippet(`\n\n![Architecture diagram](${url})\n\n`);
        toast({
          title: "Diagram inserted",
          description: "Markdown figure added to your manuscript.",
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
          "Submissions lock Wednesday at 09:00 IST while Technical Heads select the weekly LinkedIn dispatch.",
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
          title: "Could not save dispatch",
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
            ? "Dispatch Submitted for Wednesday Selection"
            : "Draft Saved",
        description:
          targetStatus === "submitted"
            ? "Your article is live in the weekly index and queued for Technical Head curation."
            : "Your manuscript draft has been saved.",
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
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-lg border border-border bg-card p-10 text-center space-y-4">
          <Lock className="mx-auto h-8 w-8 text-foreground" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Sign in with Google to Access the Writing Studio
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Publishing on CSI Tech Weekly is restricted to verified members of
            the CSI MIT-WPU Technical Wing.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button asChild className="rounded-md">
              <Link href="/auth/signin">Sign in with Google</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-md">
              <Link href="/tech-weekly">Back to Tech Weekly</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (initialContext.role === "unverified") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-lg border border-border bg-card p-10 text-center space-y-4">
          <ShieldCheck className="mx-auto h-8 w-8 text-foreground" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Verify Your CSI Roster Identity
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Link your Google account with your CSI ID and 10-digit MIT-WPU PRN
            to unlock the CSI Tech Weekly Writing Studio.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button asChild className="rounded-md">
              <Link href="/verify-csi">Verify CSI Identity</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-md">
              <Link href="/tech-weekly">Browse Tech Weekly</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!initialContext.canWrite) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-lg border border-border bg-card p-10 text-center space-y-4">
          <AlertCircle className="mx-auto h-8 w-8 text-foreground" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Technical Wing Publishing Only
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your account is verified as CSI #{initialContext.csiId} (
            {initialContext.dept || "Member"}). While reading, endorsements, and
            following are open to all roster members, weekly dispatch publishing
            is reserved for the Technical department.
          </p>
          <div className="pt-2 flex justify-center">
            <Button variant="outline" asChild className="rounded-md">
              <Link href="/tech-weekly">Return to Tech Weekly</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOptimalLength = wordCount >= 150 && wordCount <= 350;
  const isOverCap = wordCount > 2000;

  return (
    <LazyMotion features={domAnimation}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Studio Top Command Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/tech-weekly"
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Tech Weekly
            </Link>
            <span className="text-border">/</span>
            <span className="font-mono text-xs uppercase tracking-wider text-foreground">
              {existing ? `STATUS: ${existing.status}` : "NEW MANUSCRIPT"}
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {initialContext.isWindowOpen ? (
                <>
                  <Clock className="h-3 w-3 text-foreground" />
                  WINDOW OPEN (UNTIL WED 09:00 IST)
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  CUTOFF LOCKED (WED 09:00 IST)
                </>
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Segmented Mode Switch */}
            <div className="inline-flex rounded-md border border-border bg-card p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("write")}
                className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeTab === "write"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileEdit className="h-3 w-3" />
                Compose
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeTab === "preview"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-3 w-3" />
                Preview
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-md px-3 text-xs bg-card"
              disabled={
                savingStatus !== "idle" ||
                (!initialContext.isWindowOpen &&
                  initialContext.role !== "super_admin")
              }
              onClick={() => void handleSave("draft")}
            >
              {savingStatus === "saving_draft" && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              Save draft
            </Button>

            <Button
              type="button"
              size="sm"
              className="h-8 rounded-md px-4 text-xs"
              disabled={
                savingStatus !== "idle" ||
                (!initialContext.isWindowOpen &&
                  initialContext.role !== "super_admin")
              }
              onClick={() => void handleSave("submitted")}
            >
              {savingStatus === "submitting" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              Submit Dispatch
            </Button>
          </div>
        </div>

        {/* Cutoff Lock Notice */}
        {!initialContext.isWindowOpen &&
          initialContext.role !== "super_admin" && (
            <div className="rounded-lg border border-border bg-card p-4 text-xs flex items-start gap-3">
              <Lock className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Wednesday 09:00 IST Cutoff Reached
                </p>
                <p className="text-muted-foreground">
                  Submissions and edits for the current issue are locked while
                  Technical Heads Darshan (CSI #241) and Tanish (CSI #246)
                  select the weekly LinkedIn feature. The next submission window
                  opens Sunday at 00:00 IST.
                </p>
              </div>
            </div>
          )}

        {/* Editorial Feedback Banner */}
        {existing?.review_note && (
          <div className="rounded-lg border border-border bg-card p-4 text-xs space-y-1">
            <p className="font-mono uppercase tracking-wider text-foreground">
              Editorial Board Note ({existing.status.toUpperCase()})
            </p>
            <p className="text-muted-foreground">{existing.review_note}</p>
          </div>
        )}

        {restoredFromLocal && (
          <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2 font-mono text-[11px] text-muted-foreground">
            <span>Restored unsaved local manuscript from browser storage.</span>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(storageKey);
                setRestoredFromLocal(false);
              }}
              className="underline hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Studio Grid: Manuscript Canvas (8) + Publication Inspector (4) */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 lg:grid-cols-12 lg:items-start"
        >
          {/* Left 8 Columns: Manuscript Composer */}
          <div className="lg:col-span-8 rounded-lg border border-border bg-card overflow-hidden">
            {/* Formatting Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet("\n## Section Heading\n")}
                  className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-background hover:text-foreground"
                  title="Insert H2 Heading"
                >
                  <Heading2 className="h-3.5 w-3.5" />
                  H2
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertMarkdownSnippet("\n### Subsection Heading\n")
                  }
                  className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-background hover:text-foreground"
                  title="Insert H3 Heading"
                >
                  <Heading3 className="h-3.5 w-3.5" />
                  H3
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertMarkdownSnippet(
                      "\n```ts\n// Implementation snippet\n```\n"
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-background hover:text-foreground"
                  title="Insert Code Block"
                >
                  <Code className="h-3.5 w-3.5" />
                  Code
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertMarkdownSnippet("\n> Architectural takeaway or invariant\n")
                  }
                  className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-background hover:text-foreground"
                  title="Insert Blockquote"
                >
                  <Quote className="h-3.5 w-3.5" />
                  Quote
                </button>

                <input
                  ref={inlineInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleInlineUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingInline}
                  onClick={() => inlineInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-foreground hover:border-foreground/40"
                >
                  {uploadingInline ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3 w-3" />
                  )}
                  Insert Diagram
                </button>
              </div>

              <span
                className={`font-mono text-[11px] tabular-nums ${
                  isOverCap
                    ? "text-destructive font-semibold"
                    : isOptimalLength
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                }`}
              >
                {wordCount} words · ~{readTime} min read
              </span>
            </div>

            {activeTab === "write" ? (
              <div className="p-6 sm:p-8 space-y-6">
                {/* Headline Input */}
                <div className="space-y-2 border-b border-border pb-5">
                  <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Dispatch Headline
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="How Postgres MVCC Prevents Read Locks at Scale"
                    maxLength={200}
                    className="w-full bg-transparent font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/45 focus:outline-none"
                  />
                </div>

                {/* LinkedIn Hook / Deck Summary */}
                <div className="space-y-2 border-b border-border pb-5">
                  <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Lead Summary / LinkedIn Hook (1–2 Sentences)
                  </label>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="A concise thesis statement used as the opening hook when syndicated to LinkedIn..."
                    maxLength={400}
                    className="w-full bg-transparent font-serif text-base sm:text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>

                {/* Markdown Body Textarea */}
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Technical Manuscript (Markdown)
                  </label>
                  <Textarea
                    ref={bodyTextareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={20}
                    placeholder={`## The Engineering Bottleneck\nState the exact system constraint, protocol behavior, or trade-off.\n\n\`\`\`sql\nSELECT csi_id, role FROM public.csi_roster FOR UPDATE;\n\`\`\`\n\n## Production Takeaway\nSummarize what engineers should apply in practice.`}
                    className="min-h-[420px] resize-y border-0 bg-transparent p-0 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/45 focus-visible:ring-0"
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-10 space-y-6 min-h-[540px]">
                <div className="border-b border-border pb-6 space-y-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    MANUSCRIPT PREVIEW · {wordCount} WORDS
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                    {title || "Untitled Technical Dispatch"}
                  </h1>
                  {summary && (
                    <p className="font-serif text-lg text-muted-foreground leading-relaxed">
                      {summary}
                    </p>
                  )}
                </div>
                {content.trim() ? (
                  <PostBodyRenderer content={content} forceMarkdown />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Begin writing in the Compose tab to preview your formatted
                    article.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right 4 Columns: Publication Inspector Rail */}
          <aside className="lg:col-span-4 space-y-5">
            {/* 01 / Author Colophon */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                  01 / Author Credentials
                </span>
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <dl className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">CSI ROSTER ID</dt>
                  <dd className="text-foreground font-medium">
                    #{initialContext.csiId ?? "-"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">WING / YEAR</dt>
                  <dd className="text-foreground">
                    {initialContext.dept || "Tech"}
                    {initialContext.year ? ` · ${initialContext.year}` : ""}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">ISSUE CYCLE</dt>
                  <dd className="text-foreground">
                    {initialContext.currentWeek?.week_key || "Current"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 02 / Syndication Readiness Meter */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="border-b border-border pb-2.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                  02 / LinkedIn Readiness
                </span>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Headline (5+ chars)
                  </span>
                  <span className="font-mono text-[11px] text-foreground">
                    {title.trim().length >= 5 ? (
                      <Check className="h-3.5 w-3.5 inline" />
                    ) : (
                      "Pending"
                    )}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Lead Hook Summary
                  </span>
                  <span className="font-mono text-[11px] text-foreground">
                    {summary.trim().length >= 10 ? (
                      <Check className="h-3.5 w-3.5 inline" />
                    ) : (
                      "Optional"
                    )}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Length (150–300w ideal)
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-foreground">
                    {wordCount} / 2000w
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Technical Tags ({parsedTags.length}/8)
                  </span>
                  <span className="font-mono text-[11px] text-foreground">
                    {parsedTags.length > 0 ? (
                      <Check className="h-3.5 w-3.5 inline" />
                    ) : (
                      "None"
                    )}
                  </span>
                </li>
              </ul>
            </div>

            {/* 03 / Cover Artwork */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                  03 / Cover Artwork
                </span>
                {coverImage && (
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-destructive hover:underline"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                )}
              </div>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleCoverUpload}
                className="hidden"
              />

              {coverImage ? (
                <div className="space-y-2.5">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full h-8 rounded-md text-xs"
                  >
                    Replace Cover Image
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background/60 py-7 text-center transition-colors hover:border-foreground/40"
                >
                  {uploadingCover ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium text-foreground">
                    Upload Cover Diagram or Photo
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    PNG, JPG, WEBP UP TO 5 MB
                  </span>
                </button>
              )}
            </div>

            {/* 04 / Technical Taxonomy */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="border-b border-border pb-2.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                  04 / Technical Taxonomy
                </span>
              </div>

              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Comma-separated tags..."
                className="h-8 text-xs rounded-md"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_TAGS.map((tag) => {
                  const selected = parsedTags.some(
                    (t) => t.toLowerCase() === tag.toLowerCase()
                  );
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => togglePresetTag(tag)}
                      className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </m.div>
      </div>
    </LazyMotion>
  );
}
