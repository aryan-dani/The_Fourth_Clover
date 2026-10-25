"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Clock,
  Loader2,
  Lock,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { EditorShell } from "@/features/editor/EditorShell";
import { EditorCanvas } from "@/features/editor/EditorCanvas";
import { EditorSettingsSheet } from "@/features/editor/EditorSettingsSheet";
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
    [initialContext.userId, existing?.id, initialContext.currentWeek?.week_key],
  );

  const [submissionId, setSubmissionId] = useState<string | null>(
    existing?.id || null,
  );
  const [title, setTitle] = useState(existing?.title || "");
  const [summary, setSummary] = useState(existing?.summary || "");
  const [content, setContent] = useState(existing?.content || "");
  const [coverImage, setCoverImage] = useState(existing?.cover_image || "");
  const [tagsInput, setTagsInput] = useState(
    existing?.tags?.length
      ? existing.tags.join(", ")
      : "System Design, Engineering",
  );
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState<
    "idle" | "saving_draft" | "submitting"
  >("idle");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [restoredFromLocal, setRestoredFromLocal] = useState(false);

  const inlineInputRef = useRef<HTMLInputElement | null>(null);

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
          }),
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
    [tagsInput],
  );

  const togglePresetTag = (tag: string) => {
    const exists = parsedTags.some(
      (t) => t.toLowerCase() === tag.toLowerCase(),
    );
    if (exists) {
      const next = parsedTags.filter(
        (t) => t.toLowerCase() !== tag.toLowerCase(),
      );
      setTagsInput(next.join(", "));
    } else if (parsedTags.length < 8) {
      setTagsInput([...parsedTags, tag].join(", "));
    }
  };

  const insertMarkdownSnippet = (snippet: string) => {
    setContent((prev) => `${prev}${snippet}`);
  };

  const uploadImageFile = async (
    file: File,
    kind: "cover" | "inline",
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
      e.target.value = "";
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
      e.target.value = "";
    }
  };

  const windowLocked =
    !initialContext.isWindowOpen && initialContext.role !== "super_admin";

  const handleSave = async (targetStatus: "draft" | "submitted") => {
    if (windowLocked) {
      toast({
        title: "Submission window closed",
        description:
          "Submissions lock Wednesday at 09:00 IST while Technical Heads select the weekly LinkedIn dispatch.",
        variant: "destructive",
      });
      return;
    }

    setSavingStatus(
      targetStatus === "submitted" ? "submitting" : "saving_draft",
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
        <div className="space-y-4 border border-border bg-card p-10 text-center">
          <Lock className="mx-auto h-8 w-8 text-foreground" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Sign in with Google to Access the Writing Studio
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Publishing on CSI Tech Weekly is restricted to verified members of
            the CSI MIT-WPU Technical Wing.
          </p>
          <div className="flex justify-center gap-3 pt-2">
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
        <div className="space-y-4 border border-border bg-card p-10 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-foreground" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Verify Your CSI Roster Identity
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Link your Google account with your CSI ID and 10-digit MIT-WPU PRN
            to unlock the CSI Tech Weekly Writing Studio.
          </p>
          <div className="flex justify-center gap-3 pt-2">
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
        <div className="space-y-4 border border-border bg-card p-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-foreground" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Technical Wing Publishing Only
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Your account is verified as CSI #{initialContext.csiId} (
            {initialContext.dept || "Member"}). While reading, endorsements, and
            following are open to all roster members, weekly dispatch publishing
            is reserved for the Technical department.
          </p>
          <div className="flex justify-center pt-2">
            <Button variant="outline" asChild className="rounded-md">
              <Link href="/tech-weekly">Return to Tech Weekly</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const override = initialContext.settings.submissions_override;
  const alwaysOpen = override === "force_open";
  const saveStatus = windowLocked
    ? "Window locked"
    : savingStatus === "saving_draft"
      ? "Saving draft…"
      : savingStatus === "submitting"
        ? "Submitting…"
        : existing
          ? `Status: ${existing.status}`
          : "New manuscript";

  const banner = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 border border-border px-4 py-2.5 text-xs text-muted-foreground">
        {initialContext.isWindowOpen ? (
          <>
            <Clock className="h-3.5 w-3.5 text-foreground" />
            <span>
              {alwaysOpen
                ? "Submissions open — post anytime"
                : "Window open · cycles start Friday 09:00 IST"}
            </span>
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" />
            <span>Cutoff locked · next window Friday 09:00 IST</span>
          </>
        )}
        <span className="text-border">·</span>
        <span className="tabular-nums">
          {wordCount} words · ~{readTime} min read
        </span>
      </div>

      {windowLocked && (
        <div className="flex items-start gap-3 border border-border px-4 py-3 text-xs">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Submission window closed
            </p>
            <p className="text-muted-foreground">
              Technical Heads Darshan (CSI #241) and Tanish (CSI #246) are
              selecting the weekly LinkedIn feature. The next writing window
              opens Friday at 09:00 IST.
            </p>
          </div>
        </div>
      )}

      {existing?.review_note && (
        <div className="space-y-1 border border-border px-4 py-3 text-xs">
          <p className="font-mono uppercase tracking-wider text-foreground">
            Editorial Board Note ({existing.status.toUpperCase()})
          </p>
          <p className="text-muted-foreground">{existing.review_note}</p>
        </div>
      )}

      {restoredFromLocal && (
        <div className="flex items-center justify-between border border-border px-4 py-2 font-mono text-[11px] text-muted-foreground">
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
    </div>
  );

  return (
    <EditorShell
      backHref="/tech-weekly"
      backLabel="Tech Weekly"
      saveStatus={saveStatus}
      mode={mode}
      onModeChange={setMode}
      primaryAction={{
        label: "Submit",
        onClick: () => void handleSave("submitted"),
        disabled: savingStatus !== "idle" || windowLocked,
        loading: savingStatus === "submitting",
      }}
      secondaryAction={{
        label: "Save draft",
        onClick: () => void handleSave("draft"),
        disabled: savingStatus !== "idle" || windowLocked,
        loading: savingStatus === "saving_draft",
      }}
      settingsTrigger={
        <EditorSettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          coverImage={coverImage}
          onCoverFileChange={(e) => void handleCoverUpload(e)}
          onClearCover={() => setCoverImage("")}
          isUploadingCover={uploadingCover}
          tags={tagsInput}
          onTagsChange={setTagsInput}
          showExcerpt={false}
          showSlug={false}
          showFormat={false}
        />
      }
      banner={banner}
    >
      <input
        ref={inlineInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => void handleInlineUpload(e)}
        className="hidden"
      />

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-8">
          <EditorCanvas
            title={title}
            onTitleChange={setTitle}
            dek={summary}
            onDekChange={setSummary}
            showDek
            content={content}
            onContentChange={setContent}
            titlePlaceholder="How Postgres MVCC Prevents Read Locks at Scale"
            dekPlaceholder="Lead summary / LinkedIn hook (1–2 sentences)"
            bodyPlaceholder={`## The Engineering Bottleneck\nState the exact system constraint, protocol behavior, or trade-off.\n\n## Production Takeaway\nSummarize what engineers should apply in practice.`}
            mode={mode}
            onImageInsert={() => {
              if (!uploadingInline) inlineInputRef.current?.click();
            }}
            preview={
              <div className="min-h-[28rem] space-y-4 p-5 sm:p-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  Manuscript preview · {wordCount} words
                </p>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {title || "Untitled Technical Dispatch"}
                </h1>
                {summary && (
                  <p className="font-serif text-lg leading-relaxed text-muted-foreground">
                    {summary}
                  </p>
                )}
                {content.trim() ? (
                  <PostBodyRenderer content={content} forceMarkdown />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Begin writing in Write mode to preview your formatted
                    article.
                  </p>
                )}
              </div>
            }
          />
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <div className="space-y-3 border border-border p-5">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                Author
              </span>
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <dl className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">CSI ID</dt>
                <dd className="font-medium text-foreground">
                  #{initialContext.csiId ?? "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Wing / Year</dt>
                <dd className="text-foreground">
                  {initialContext.dept || "Tech"}
                  {initialContext.year ? ` · ${initialContext.year}` : ""}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Issue</dt>
                <dd className="text-foreground">
                  {initialContext.currentWeek?.week_key || "Current"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3 border border-border p-5">
            <div className="border-b border-border pb-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                LinkedIn readiness
              </span>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Headline (5+ chars)</span>
                <span className="font-mono text-[11px] text-foreground">
                  {title.trim().length >= 5 ? (
                    <Check className="inline h-3.5 w-3.5" />
                  ) : (
                    "Pending"
                  )}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Lead hook</span>
                <span className="font-mono text-[11px] text-foreground">
                  {summary.trim().length >= 10 ? (
                    <Check className="inline h-3.5 w-3.5" />
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
                  Tags ({parsedTags.length}/8)
                </span>
                <span className="font-mono text-[11px] text-foreground">
                  {parsedTags.length > 0 ? (
                    <Check className="inline h-3.5 w-3.5" />
                  ) : (
                    "None"
                  )}
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 border border-border p-5">
            <div className="border-b border-border pb-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                Preset tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((tag) => {
                const selected = parsedTags.some(
                  (t) => t.toLowerCase() === tag.toLowerCase(),
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
      </div>
    </EditorShell>
  );
}
