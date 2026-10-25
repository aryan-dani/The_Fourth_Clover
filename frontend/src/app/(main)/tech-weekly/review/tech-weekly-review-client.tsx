"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CopyForLinkedInButton } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import {
  reviewTechSubmissionAction,
  selectTechWeeklyPickAction,
} from "@/features/data/tech-weekly-actions";
import type {
  CsiRole,
  TechSubmissionWithAuthor,
  TechWeek,
} from "@/types/database";

type ReviewQueueProps = {
  authorized: boolean;
  role: CsiRole;
  csiId: number | null;
  currentWeek: TechWeek | null;
  isWindowOpen: boolean;
  submissions: TechSubmissionWithAuthor[];
};

export default function TechWeeklyReviewClient({
  initialData,
}: {
  initialData: ReviewQueueProps;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<TechSubmissionWithAuthor[]>(
    initialData.submissions
  );
  const [filterStatus, setFilterStatus] = useState<
    "current_week" | "all" | "submitted" | "approved" | "selected" | "rejected"
  >("current_week");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const currentWeekPick = useMemo(
    () =>
      submissions.find(
        (s) =>
          s.status === "selected" &&
          initialData.currentWeek &&
          s.week_id === initialData.currentWeek.id
      ) || null,
    [submissions, initialData.currentWeek]
  );

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (filterStatus === "current_week") {
        return initialData.currentWeek
          ? s.week_id === initialData.currentWeek.id
          : true;
      }
      if (filterStatus === "all") return true;
      return s.status === filterStatus;
    });
  }, [submissions, filterStatus, initialData.currentWeek]);

  const handleReview = async (
    sub: TechSubmissionWithAuthor,
    status: "approved" | "rejected"
  ) => {
    setBusyId(sub.id);
    try {
      const note = noteById[sub.id] ?? sub.review_note ?? "";
      const res = await reviewTechSubmissionAction({
        submissionId: sub.id,
        status,
        reviewNote: note,
      });

      if (!res.success) {
        toast({
          title: "Review action failed",
          description: res.error || "Could not update submission.",
          variant: "destructive",
        });
        return;
      }

      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === sub.id
            ? { ...item, status, review_note: note || null }
            : item
        )
      );
      toast({
        title:
          status === "approved" ? "Submission Approved" : "Revision Requested",
        description: `"${sub.title}" marked as ${status}.`,
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleSelectPick = async (sub: TechSubmissionWithAuthor) => {
    setBusyId(sub.id);
    try {
      const note = noteById[sub.id] ?? sub.review_note ?? "";
      const res = await selectTechWeeklyPickAction({
        submissionId: sub.id,
        reviewNote: note,
      });

      if (!res.success) {
        toast({
          title: "Could not select weekly pick",
          description: res.error || "Failed to select weekly LinkedIn pick.",
          variant: "destructive",
        });
        return;
      }

      setSubmissions((prev) =>
        prev.map((item) => {
          if (item.id === sub.id) {
            return {
              ...item,
              status: "selected",
              selected_at: new Date().toISOString(),
              review_note: note || item.review_note,
            };
          }
          if (
            item.week_id === sub.week_id &&
            item.status === "selected" &&
            item.id !== sub.id
          ) {
            return {
              ...item,
              status: "approved",
              selected_at: null,
              selected_by: null,
            };
          }
          return item;
        })
      );

      toast({
        title: "Selected as Weekly LinkedIn Pick",
        description: res.replacedId
          ? `"${sub.title}" replaced the previous pick for this week (logged in audit trail).`
          : `"${sub.title}" is now this week's official CSI LinkedIn feature.`,
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  if (!initialData.authorized) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-lg border border-border bg-card p-10 text-center space-y-4">
          <ShieldAlert className="mx-auto h-8 w-8 text-foreground" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Restricted to CSI Technical Heads & Super Admin
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Only CSI Technical Heads (IDs 241 and 246) and Super Admin (ID 303)
            can access the Wednesday curation desk and select the weekly
            LinkedIn feature.
          </p>
          <div className="pt-2 flex justify-center">
            <Button variant="outline" asChild className="rounded-md">
              <Link href="/tech-weekly">Back to CSI Tech Weekly</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <header className="border-b border-border pb-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            <Link
              href="/tech-weekly"
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              CSI Tech Weekly
            </Link>
            <span>
              {initialData.isWindowOpen ? (
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <Clock className="h-3 w-3" />
                  SUBMISSIONS OPEN (CYCLES START FRIDAY 09:00 IST)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <Lock className="h-3 w-3" />
                  WEDNESDAY SELECTION WINDOW ACTIVE
                </span>
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Wednesday Curation Desk
              </h1>
              <p className="text-sm text-muted-foreground">
                Signed in as{" "}
                <span className="font-mono uppercase text-foreground">
                  {initialData.role}
                </span>{" "}
                {initialData.csiId ? `(CSI #${initialData.csiId})` : ""} ·
                Select one dispatch per week for official CSI MIT-WPU LinkedIn
                syndication.
              </p>
            </div>
          </div>
        </header>

        {/* Active Weekly Pick Ledger Box */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border bg-muted/40 px-6 py-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
              Active Weekly Selection ·{" "}
              {initialData.currentWeek?.title || "Current Issue"}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              1 Pick / Week Invariant
            </span>
          </div>
          <div className="p-6 flex flex-wrap items-center justify-between gap-4">
            {currentWeekPick ? (
              <div className="space-y-1">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {currentWeekPick.title}
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  By{" "}
                  {currentWeekPick.author?.full_name ||
                    currentWeekPick.author?.username}{" "}
                  (CSI #{currentWeekPick.author?.csi_id ?? "N/A"}) ·{" "}
                  {currentWeekPick.word_count} words
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No dispatch has been selected for this week yet. Review the
                submissions below and click &ldquo;Select as Weekly
                Pick&rdquo;.
              </p>
            )}

            {currentWeekPick && (
              <div className="flex flex-wrap items-center gap-2">
                <CopyForLinkedInButton submission={currentWeekPick} size="sm" />
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-md text-xs"
                >
                  <Link href={`/tech-weekly/${currentWeekPick.slug}`}>
                    View Dispatch
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-4">
          {(
            [
              { id: "current_week", label: "Current Issue" },
              { id: "all", label: "All Issues" },
              { id: "submitted", label: "Submitted" },
              { id: "approved", label: "Approved" },
              { id: "selected", label: "Selected Picks" },
              { id: "rejected", label: "Revisions Requested" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-sm font-mono text-xs uppercase tracking-wider transition-colors ${
                filterStatus === tab.id
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
            No dispatches match the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((sub) => {
              const isExpanded = expandedId === sub.id;
              const isBusy = busyId === sub.id;
              const isSelected = sub.status === "selected";

              return (
                <div key={sub.id}
                  className={`rounded-lg border bg-card p-6 transition-colors ${
                    isSelected ? "border-foreground" : "border-border"
                  }`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
                        <span
                          className={`px-2 py-0.5 rounded-sm border ${
                            isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-foreground"
                          }`}
                        >
                          {isSelected ? "SELECTED LINKEDIN PICK" : sub.status}
                        </span>
                        <span className="text-muted-foreground">
                          {sub.week?.title || "Weekly Issue"} · {sub.word_count}{" "}
                          words · ~{sub.read_time} min read
                        </span>
                      </div>

                      <h3 className="font-display text-2xl font-semibold text-foreground">
                        <Link
                          href={`/tech-weekly/${sub.slug}`}
                          className="hover:underline"
                        >
                          {sub.title}
                        </Link>
                      </h3>

                      <p className="font-mono text-xs text-muted-foreground">
                        Author:{" "}
                        <span className="text-foreground">
                          {sub.author?.full_name || sub.author?.username}
                        </span>{" "}
                        · CSI #{sub.author?.csi_id ?? "Unlinked"} (
                        {sub.author?.dept || "Tech"}
                        {sub.author?.year ? ` · ${sub.author.year}` : ""})
                      </p>

                      {sub.summary && (
                        <p className="text-sm text-muted-foreground pt-1 leading-relaxed">
                          {sub.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-md text-xs h-8"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : sub.id)
                        }
                      >
                        {isExpanded ? (
                          <>
                            Hide Manuscript
                            <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            Read Manuscript
                            <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                          </>
                        )}
                      </Button>

                      {isSelected && (
                        <CopyForLinkedInButton submission={sub} size="sm" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 rounded-md border border-border bg-background p-5 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                      {sub.content}
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <Input
                        value={noteById[sub.id] ?? sub.review_note ?? ""}
                        onChange={(e) =>
                          setNoteById((prev) => ({
                            ...prev,
                            [sub.id]: e.target.value,
                          }))
                        }
                        placeholder="Editorial note for the author..."
                        className="h-8 text-xs rounded-md"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => void handleReview(sub, "approved")}
                        className="h-8 rounded-md text-xs"
                      >
                        {isBusy ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => void handleReview(sub, "rejected")}
                        className="h-8 rounded-md text-xs"
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Request Revision
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={isBusy || isSelected}
                        onClick={() => void handleSelectPick(sub)}
                        className="h-8 rounded-md text-xs"
                      >
                        {isSelected
                          ? "Selected for LinkedIn"
                          : "Select as Weekly Pick"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
