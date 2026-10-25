"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArticleCard,
  EmptyState,
  PageHeader,
  SectionLabel,
} from "@/components/editorial";
import {
  PenTool,
  Clock,
  Lock,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { FeaturedTechWeeklyBanner } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import type { TechWeeklyLandingPayload } from "@/features/data/tech-weekly-actions";
import { cn } from "@/lib/utils";

function formatCountdown(targetIso: string | undefined): {
  expired: boolean;
  label: string;
} {
  if (!targetIso) return { expired: false, label: "--d : --h : --m" };
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) {
    return { expired: true, label: "Cutoff passed · next window Friday 09:00 IST" };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    expired: false,
    label: `${pad(days)}d : ${pad(hours)}h : ${pad(mins)}m remaining`,
  };
}

export function TechWeeklyClient({
  initialData,
}: {
  initialData: TechWeeklyLandingPayload;
}) {
  const { user, profile } = useAuth();
  const [selectedWeekId, setSelectedWeekId] = useState<string>(
    initialData.currentWeek?.id || "all",
  );
  const [countdown, setCountdown] = useState<{
    expired: boolean;
    label: string;
  }>({ expired: false, label: "--d : --h : --m" });

  useEffect(() => {
    const update = () => {
      setCountdown(formatCountdown(initialData.currentWeek?.cutoff_at));
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [initialData.currentWeek?.cutoff_at]);

  const role = profile?.role || "unverified";
  const isTechMember =
    role === "tech_member" ||
    role === "tech_head" ||
    role === "super_admin" ||
    Boolean(profile?.is_admin);
  const isTechHeadOrAdmin =
    role === "tech_head" ||
    role === "super_admin" ||
    profile?.csi_id === 241 ||
    profile?.csi_id === 246 ||
    profile?.csi_id === 303 ||
    Boolean(profile?.is_admin);

  const filteredSubmissions = useMemo(() => {
    if (selectedWeekId === "all") return initialData.submissions;
    return initialData.submissions.filter((s) => s.week_id === selectedWeekId);
  }, [initialData.submissions, selectedWeekId]);

  const activeWeekObj = useMemo(
    () =>
      initialData.allWeeks.find((w) => w.id === selectedWeekId) ||
      initialData.currentWeek,
    [initialData.allWeeks, initialData.currentWeek, selectedWeekId],
  );

  return (
    <div className="mx-auto max-w-content space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <span>CSI MIT-WPU · Technical Dispatch Archive</span>
        <span className="inline-flex items-center gap-2 text-foreground tabular-nums">
          {initialData.isWindowOpen ? (
            <>
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {countdown.expired
                ? "Submissions open"
                : `Window open · ${countdown.label}`}
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Window closed · next opens Friday 09:00 IST
            </>
          )}
        </span>
      </div>

      <PageHeader
        label="Tech Weekly"
        title="CSI Tech Weekly"
        description={
          activeWeekObj?.prompt ||
          "Weekly engineering dispatches, systems breakdowns, and implementation notes from the CSI MIT-WPU Technical Wing."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {isTechMember ? (
              <Button asChild size="sm">
                <Link href="/tech-weekly/write">
                  <PenTool className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  {initialData.isWindowOpen || role === "super_admin"
                    ? "Write dispatch"
                    : "Manage drafts"}
                </Link>
              </Button>
            ) : user && role === "unverified" ? (
              <Button asChild size="sm">
                <Link href="/verify-csi">Verify CSI Identity</Link>
              </Button>
            ) : !user ? (
              <Button asChild size="sm">
                <Link href="/auth/signin">Sign in to contribute</Link>
              </Button>
            ) : null}

            {isTechHeadOrAdmin && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-hairline"
              >
                <Link href="/tech-weekly/review">
                  <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Curation queue
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {initialData.featuredPick && (
        <FeaturedTechWeeklyBanner
          submission={initialData.featuredPick}
          canCopyLinkedIn={isTechHeadOrAdmin}
        />
      )}

      <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="space-y-6 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
            <div className="flex items-center gap-2">
              <SectionLabel>Published dispatches</SectionLabel>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                ({filteredSubmissions.length})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedWeekId("all")}
                className={cn(
                  "border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors",
                  selectedWeekId === "all"
                    ? "border-foreground bg-foreground text-background"
                    : "border-hairline text-muted-foreground hover:text-foreground",
                )}
              >
                All issues
              </button>
              {initialData.allWeeks.slice(0, 4).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWeekId(w.id)}
                  className={cn(
                    "border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors",
                    selectedWeekId === w.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-hairline text-muted-foreground hover:text-foreground",
                  )}
                >
                  {w.week_key}
                </button>
              ))}
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <EmptyState
              title="No dispatches filed for this cycle yet"
              description="Verified CSI Technical Wing engineers can submit anytime while the window is open. Cycles open Friday 09:00 IST."
              action={
                isTechMember ? (
                  <Button asChild size="sm">
                    <Link href="/tech-weekly/write">File the first dispatch</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredSubmissions.map((sub, idx) => (
                <ArticleCard
                  key={sub.id}
                  section="tech"
                  variant={idx === 0 ? "lead" : "standard"}
                  className={idx === 0 ? "sm:col-span-2" : undefined}
                  title={sub.title}
                  slug={sub.slug}
                  excerpt={
                    sub.summary?.trim() ||
                    `${sub.content
                      .replace(/[#*`>\-\[\]!]/g, "")
                      .replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 190)}…`
                  }
                  coverImage={sub.cover_image}
                  author={sub.author}
                  publishedAt={sub.created_at}
                  readTime={sub.read_time}
                  tags={sub.tags}
                  reactionCount={sub.reaction_counts?.total}
                  commentCount={sub.comment_count}
                  priority={idx < 2}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="overflow-hidden border border-hairline">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
              <SectionLabel>Contributor index</SectionLabel>
              <span className="meta-label text-muted-foreground">
                Season standing
              </span>
            </div>

            {initialData.leaderboard.length === 0 ? (
              <div className="p-6 font-serif text-sm text-muted-foreground">
                Standings populate as weekly dispatches are filed and selected.
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {initialData.leaderboard.map((entry, idx) => {
                  const name =
                    entry.author.full_name ||
                    entry.author.username ||
                    "CSI Engineer";
                  return (
                    <div
                      key={entry.author.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-5 font-mono text-[11px] tabular-nums text-muted-foreground">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/profile/${entry.author.username}`}
                            className="block truncate font-medium text-foreground hover:text-brand"
                          >
                            {name}
                          </Link>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            CSI #{entry.author.csi_id ?? "-"} ·{" "}
                            {entry.submissionsCount} filed ·{" "}
                            {entry.selectedCount} selected
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-medium tabular-nums text-foreground">
                        {entry.score} pt
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-hairline px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              25×selected + 10×dispatch + 5×streak + 2×endorse
            </div>
          </div>

          <div className="space-y-3 border border-hairline p-5">
            <SectionLabel>Editorial standards</SectionLabel>
            <ul className="space-y-2 font-serif text-sm leading-relaxed text-muted-foreground">
              <li>
                1. Cycles open Friday 09:00 IST — submit anytime while the window is open
                IST.
              </li>
              <li>
                2. Aim for 150–300 words for LinkedIn syndication (max 2,000 for
                deep tutorials).
              </li>
              <li>
                3. Technical Heads select one featured dispatch every Wednesday
                morning.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
