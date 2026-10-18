"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PenTool,
  Clock,
  Lock,
  MessageSquare,
  ThumbsUp,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { FeaturedTechWeeklyBanner } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import type { TechWeeklyLandingPayload } from "@/features/data/tech-weekly-actions";

function formatCountdown(targetIso: string | undefined): {
  expired: boolean;
  label: string;
} {
  if (!targetIso) return { expired: false, label: "--d : --h : --m" };
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) {
    return { expired: true, label: "CUTOFF PASSED (WED 09:00 IST)" };
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
    initialData.currentWeek?.id || "all"
  );
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(initialData.currentWeek?.cutoff_at)
  );

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
    [initialData.allWeeks, initialData.currentWeek, selectedWeekId]
  );

  return (
    <LazyMotion features={domAnimation}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
        {/* Issue Masthead */}
        <header className="border-b border-border pb-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            <span>CSI MIT-WPU · TECHNICAL DISPATCH ARCHIVE</span>
            <span className="inline-flex items-center gap-2 text-foreground tabular-nums">
              {initialData.isWindowOpen && !countdown.expired ? (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  WINDOW OPEN · {countdown.label.toUpperCase()}
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  WEDNESDAY CURATION WINDOW ACTIVE
                </>
              )}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8 space-y-3">
              <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.08]">
                CSI Tech Weekly
              </h1>
              <p className="max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground">
                {activeWeekObj?.prompt ||
                  "Weekly engineering dispatches, systems breakdowns, and implementation notes authored by verified members of the CSI MIT-WPU Technical Wing."}
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-2.5">
              {isTechMember ? (
                <Button asChild className="rounded-md px-4 text-xs font-medium">
                  <Link href="/tech-weekly/write">
                    <PenTool className="mr-2 h-3.5 w-3.5" />
                    {initialData.isWindowOpen || role === "super_admin"
                      ? "Write Weekly Dispatch"
                      : "Manage Drafts"}
                  </Link>
                </Button>
              ) : user && role === "unverified" ? (
                <Button asChild className="rounded-md px-4 text-xs font-medium">
                  <Link href="/verify-csi">Verify CSI Identity</Link>
                </Button>
              ) : !user ? (
                <Button asChild className="rounded-md px-4 text-xs font-medium">
                  <Link href="/auth/signin">Sign in to Contribute</Link>
                </Button>
              ) : null}

              {isTechHeadOrAdmin && (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-md px-4 text-xs font-medium bg-card"
                >
                  <Link href="/tech-weekly/review">
                    <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
                    Curation Queue
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Featured Weekly Selection Spread */}
        {initialData.featuredPick && (
          <FeaturedTechWeeklyBanner
            submission={initialData.featuredPick}
            canCopyLinkedIn={isTechHeadOrAdmin}
          />
        )}

        {/* Main 12-Column Editorial Layout: Dispatches Index (8) + Contributor Ledger (4) */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left 8 Columns: Weekly Dispatches */}
          <div className="lg:col-span-8 space-y-6">
            {/* Cycle Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-foreground">
                  Published Dispatches
                </span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  ({filteredSubmissions.length})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedWeekId("all")}
                  className={`px-2.5 py-1 rounded-sm font-mono text-[11px] uppercase tracking-wider transition-colors ${
                    selectedWeekId === "all"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground border border-border bg-card"
                  }`}
                >
                  All Issues
                </button>
                {initialData.allWeeks.slice(0, 4).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWeekId(w.id)}
                    className={`px-2.5 py-1 rounded-sm font-mono text-[11px] uppercase tracking-wider transition-colors ${
                      selectedWeekId === w.id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground border border-border bg-card"
                    }`}
                  >
                    {w.week_key}
                  </button>
                ))}
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center space-y-3">
                <p className="font-display text-xl font-semibold text-foreground">
                  No dispatches filed for this cycle yet.
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Verified CSI Technical Wing engineers can submit articles
                  between Sunday 00:00 IST and Wednesday 09:00 IST.
                </p>
                {isTechMember && (
                  <div className="pt-2">
                    <Button asChild size="sm" className="rounded-md">
                      <Link href="/tech-weekly/write">
                        File the First Dispatch
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border border-b border-border">
                {filteredSubmissions.map((sub, idx) => {
                  const authorName =
                    sub.author?.full_name ||
                    sub.author?.username ||
                    "CSI Engineer";
                  const authorRoleBadge = sub.author?.dept
                    ? `${sub.author.dept}${sub.author.year ? ` · ${sub.author.year}` : ""}`
                    : "Tech";
                  const excerpt =
                    sub.summary?.trim() ||
                    sub.content
                      .replace(/[#*`>\-\[\]!]/g, "")
                      .replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 190) + "...";

                  const indexNum = String(idx + 1).padStart(2, "0");

                  return (
                    <m.article
                      key={sub.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                      className="group py-7 first:pt-2"
                    >
                      <div className="grid gap-4 sm:grid-cols-12">
                        {/* Numbered Index Column */}
                        <div className="sm:col-span-2 flex sm:flex-col justify-between sm:justify-start gap-1">
                          <span className="font-mono text-xs text-muted-foreground tabular-nums">
                            {indexNum}
                          </span>
                          {sub.status === "selected" ? (
                            <span className="inline-block w-fit font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-foreground text-foreground">
                              SELECTED PICK
                            </span>
                          ) : sub.status === "approved" ? (
                            <span className="inline-block w-fit font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              REVIEWED
                            </span>
                          ) : null}
                        </div>

                        {/* Main Article Column */}
                        <div className="sm:col-span-10 space-y-3">
                          {sub.tags && sub.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {sub.tags.slice(0, 4).map((t) => (
                                <span
                                  key={t}
                                  className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}

                          <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground leading-snug">
                            <Link
                              href={`/tech-weekly/${sub.slug}`}
                              className="inline-flex items-baseline gap-2 group-hover:underline decoration-1 underline-offset-4"
                            >
                              <span>{sub.title}</span>
                              <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                            </Link>
                          </h3>

                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {excerpt}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-5 w-5 rounded-sm border border-border">
                                <AvatarImage
                                  src={sub.author?.avatar_url || ""}
                                />
                                <AvatarFallback className="rounded-sm font-mono text-[10px]">
                                  {authorName[0]?.toUpperCase() || "C"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">
                                {authorName}
                              </span>
                              <span className="font-mono text-[11px]">
                                CSI #{sub.author?.csi_id ?? "-"} ·{" "}
                                {authorRoleBadge}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums">
                              <span>
                                {sub.read_time} min · {sub.word_count}w
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {sub.reaction_counts?.total || 0}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {sub.comment_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </m.article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right 4 Columns: Contributor Index Ledger */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="border-b border-border bg-muted/40 px-5 py-3.5 flex items-center justify-between">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-foreground">
                  Contributor Index
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Season Standing
                </span>
              </div>

              {initialData.leaderboard.length === 0 ? (
                <div className="p-6 text-xs text-muted-foreground">
                  Contributor standings populate automatically as weekly
                  dispatches are filed and selected.
                </div>
              ) : (
                <div className="divide-y divide-border">
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
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-5">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/profile/${entry.author.username}`}
                              className="font-medium text-foreground hover:underline truncate block"
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
                        <span className="font-mono text-xs font-medium text-foreground tabular-nums">
                          {entry.score} pt
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-border bg-muted/20 px-5 py-3 font-mono text-[10px] text-muted-foreground">
                INDEX FORMULA: 25×SELECTED + 10×DISPATCH + 5×STREAK + 2×ENDORSE
              </div>
            </div>

            {/* Editorial Charter Box */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                Editorial Standards
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <li>
                  1. Submissions open Sunday 00:00 IST and lock Wednesday 09:00
                  IST.
                </li>
                <li>
                  2. Aim for 150 to 300 words for optimal LinkedIn syndication
                  (maximum 2,000 words for deep technical tutorials).
                </li>
                <li>
                  3. Technical Heads (CSI #241, #246) select one featured
                  dispatch every Wednesday morning.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </LazyMotion>
  );
}
