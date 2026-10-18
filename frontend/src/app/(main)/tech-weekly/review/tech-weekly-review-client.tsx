"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          status === "approved" ? "Submission Approved" : "Changes Requested",
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
        title: "Selected as Weekly LinkedIn Pick!",
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
      <div className="container max-w-3xl py-16">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h1 className="font-display text-2xl font-bold">
            Restricted to CSI Technical Heads & Super Admin
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only CSI Technical Heads (IDs 241 and 246) and Super Admin (ID 303)
            can access the Wednesday curation queue and select the weekly
            LinkedIn feature.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/tech-weekly">Back to CSI Tech Weekly</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="container max-w-6xl py-10 space-y-8">
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
              Technical Head Curation Queue
            </h1>
            <p className="text-sm text-muted-foreground">
              Signed in as{" "}
              <strong className="text-foreground uppercase">
                {initialData.role}
              </strong>{" "}
              {initialData.csiId ? `(CSI #${initialData.csiId})` : ""} · Select
              exactly ONE post per week for CSI MIT-WPU LinkedIn reposting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {initialData.isWindowOpen ? (
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 px-3 py-1">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Submissions Open (Sun 00:00 to Wed 09:00 IST)
              </Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 px-3 py-1">
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Wednesday Selection Window Active
              </Badge>
            )}
          </div>
        </div>

        {/* Active Weekly Pick Banner */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/90 to-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Award className="h-4 w-4" />
                {initialData.currentWeek?.title || "Current Week"} LinkedIn Pick
              </div>
              {currentWeekPick ? (
                <>
                  <h2 className="font-display text-xl font-bold">
                    {currentWeekPick.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    By{" "}
                    {currentWeekPick.author?.full_name ||
                      currentWeekPick.author?.username}{" "}
                    (CSI #{currentWeekPick.author?.csi_id ?? "N/A"}) ·{" "}
                    {currentWeekPick.word_count} words
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No article selected for this week yet. Review the submissions
                  below and click &ldquo;Select as Weekly LinkedIn Pick&rdquo;.
                </p>
              )}
            </div>

            {currentWeekPick && (
              <div className="flex flex-wrap items-center gap-2">
                <CopyForLinkedInButton submission={currentWeekPick} />
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/tech-weekly/${currentWeekPick.slug}`}>
                    View Post
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "current_week", label: "Current Week" },
              { id: "all", label: "All Weeks" },
              { id: "submitted", label: "Submitted" },
              { id: "approved", label: "Approved" },
              { id: "selected", label: "Selected Picks" },
              { id: "rejected", label: "Changes Requested" },
            ] as const
          ).map((tab) => (
            <Button
              key={tab.id}
              type="button"
              size="sm"
              variant={filterStatus === tab.id ? "default" : "outline"}
              onClick={() => setFilterStatus(tab.id)}
              className="rounded-xl"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card/60 p-12 text-center text-muted-foreground">
            No submissions match the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((sub) => {
              const isExpanded = expandedId === sub.id;
              const isBusy = busyId === sub.id;
              const isSelected = sub.status === "selected";

              return (
                <m.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-3xl border p-6 transition-all ${
                    isSelected
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-border/70 bg-card/90"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            isSelected
                              ? "default"
                              : sub.status === "approved"
                                ? "secondary"
                                : sub.status === "rejected"
                                  ? "destructive"
                                  : "outline"
                          }
                          className="uppercase text-[10px]"
                        >
                          {sub.status === "selected"
                            ? "Selected LinkedIn Pick"
                            : sub.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {sub.week?.title || "Weekly Cycle"} · {sub.word_count}{" "}
                          words · ~{sub.read_time} min read
                        </span>
                      </div>

                      <h3 className="font-display text-xl font-bold">
                        <Link
                          href={`/tech-weekly/${sub.slug}`}
                          className="hover:underline"
                        >
                          {sub.title}
                        </Link>
                      </h3>

                      <p className="text-xs text-muted-foreground">
                        Author:{" "}
                        <strong className="text-foreground">
                          {sub.author?.full_name || sub.author?.username}
                        </strong>{" "}
                        · CSI #{sub.author?.csi_id ?? "Unlinked"} (
                        {sub.author?.dept || "Tech"}
                        {sub.author?.year ? ` · ${sub.author.year}` : ""})
                      </p>

                      {sub.summary && (
                        <p className="text-sm text-muted-foreground pt-1">
                          {sub.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : sub.id)
                        }
                      >
                        {isExpanded ? (
                          <>
                            Hide Body
                            <ChevronUp className="ml-1.5 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Read Body
                            <ChevronDown className="ml-1.5 h-4 w-4" />
                          </>
                        )}
                      </Button>

                      {isSelected && (
                        <CopyForLinkedInButton submission={sub} size="sm" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                      {sub.content}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <Input
                        value={noteById[sub.id] ?? sub.review_note ?? ""}
                        onChange={(e) =>
                          setNoteById((prev) => ({
                            ...prev,
                            [sub.id]: e.target.value,
                          }))
                        }
                        placeholder="Optional editorial note for the author..."
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => handleReview(sub, "approved")}
                      >
                        {isBusy ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                        )}
                        Approve
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => handleReview(sub, "rejected")}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                        Request Changes
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={isBusy || isSelected}
                        onClick={() => handleSelectPick(sub)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        {isSelected
                          ? "Selected for LinkedIn"
                          : "Select as Weekly LinkedIn Pick"}
                      </Button>
                    </div>
                  </div>
                </m.div>
              );
            })}
          </div>
        )}
      </div>
    </LazyMotion>
  );
}
