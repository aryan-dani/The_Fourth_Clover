"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/auth-context";
import {
  FeaturedTechWeeklyBanner,
  CopyForLinkedInButton,
} from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import type {
  TechWeeklyLandingPayload,
  LeaderboardEntry,
} from "@/features/data/tech-weekly-actions";
import type { TechSubmissionWithAuthor } from "@/types/database";
import { formatRelativeTime } from "@/lib/utils";
import {
  Terminal,
  PenTool,
  ShieldCheck,
  FileCheck,
  Award,
  Flame,
  Lightbulb,
  Heart,
  MessageCircle,
  Clock,
  Trophy,
  Search,
  Calendar,
  Lock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

function formatCsiBadge(author: TechSubmissionWithAuthor["author"]): string {
  if (author.role === "super_admin" || author.csi_id === 303) {
    return "CSI Tech Secretary";
  }
  if (author.role === "tech_head" || author.csi_id === 241 || author.csi_id === 246) {
    return "CSI Tech Head";
  }
  const dept = author.dept || "Tech";
  return author.year ? `CSI ${dept} · ${author.year}` : `CSI ${dept}`;
}

function SubmissionCard({
  submission,
  index,
}: {
  submission: TechSubmissionWithAuthor;
  index: number;
}) {
  const authorName =
    submission.author?.full_name || submission.author?.username || "CSI Member";
  const isSelected = submission.status === "selected";

  return (
    <m.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.25) }}
      className="h-full"
    >
      <Card
        className={`group flex flex-col h-full overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl glass ${
          isSelected
            ? "border-amber-500/50 ring-1 ring-amber-500/25"
            : "border-border/70 hover:border-emerald-500/40"
        }`}
      >
        {submission.cover_image && (
          <Link
            href={`/tech-weekly/${submission.slug}`}
            className="block aspect-video overflow-hidden relative bg-muted/30"
          >
            <Image
              src={submission.cover_image}
              alt={submission.title}
              width={640}
              height={360}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </Link>
        )}

        <CardContent className="p-6 flex flex-col flex-1 gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isSelected ? (
                <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-400 text-[11px] font-semibold">
                  <Award className="h-3 w-3 mr-1" />
                  LinkedIn Pick
                </Badge>
              ) : submission.status === "approved" ? (
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px]"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[11px]">
                  Submitted
                </Badge>
              )}

              {submission.tags?.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {submission.read_time}m · {submission.word_count}w
            </span>
          </div>

          <Link href={`/tech-weekly/${submission.slug}`} className="block">
            <h3 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
              {submission.title}
            </h3>
          </Link>

          <p className="font-serif text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
            {submission.summary ||
              submission.content
                .replace(/[#*`>\[\]!]/g, "")
                .slice(0, 180)
                .trim() + "..."}
          </p>

          <div className="pt-3 mt-auto border-t border-border/60 flex items-center justify-between gap-2">
            <Link
              href={`/profile/${submission.author?.username}`}
              className="flex items-center gap-2.5 min-w-0 group/author"
            >
              <Avatar className="h-7 w-7 ring-1 ring-border">
                <AvatarImage src={submission.author?.avatar_url || ""} />
                <AvatarFallback className="text-[10px] font-bold">
                  {authorName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate group-hover/author:text-emerald-500 transition-colors">
                  {authorName}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                  {formatCsiBadge(submission.author)}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2.5 text-xs text-muted-foreground shrink-0">
              <span
                className="flex items-center gap-1"
                title="Likes, Insightful, and Fire reactions"
              >
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                {submission.reaction_counts?.like || 0}
              </span>
              <span className="flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                {submission.reaction_counts?.insightful || 0}
              </span>
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {submission.reaction_counts?.fire || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {submission.comment_count || 0}
              </span>
            </div>
          </div>

          {isSelected && (
            <div className="pt-2 flex justify-end">
              <CopyForLinkedInButton
                submission={submission}
                size="sm"
                variant="secondary"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </m.div>
  );
}

function LeaderboardRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  const name = entry.author.full_name || entry.author.username;
  return (
    <m.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: Math.min(rank * 0.04, 0.3) }}
      className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/75 p-4 hover:border-emerald-500/40 transition-colors"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display font-bold text-sm ${
            rank === 1
              ? "bg-amber-500 text-amber-950 shadow-sm"
              : rank === 2
              ? "bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
              : rank === 3
              ? "bg-amber-700/80 text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
          #{rank}
        </div>
        <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20">
          <AvatarImage src={entry.author.avatar_url || ""} />
          <AvatarFallback className="font-bold text-xs">
            {name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <Link
            href={`/profile/${entry.author.username}`}
            className="font-display font-semibold text-sm sm:text-base text-foreground hover:text-emerald-500 transition-colors truncate block"
          >
            {name}
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              @{entry.author.username}
            </span>
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              {formatCsiBadge(entry.author)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-right shrink-0">
        <div>
          <p className="font-display text-base sm:text-lg font-bold text-foreground">
            {entry.submissionsCount}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Posts
          </p>
        </div>
        <div>
          <p className="font-display text-base sm:text-lg font-bold text-amber-500">
            {entry.selectedCount}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Selected
          </p>
        </div>
        <div>
          <p className="font-display text-base sm:text-lg font-bold text-emerald-500">
            {entry.reactionsReceived}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Reactions
          </p>
        </div>
        <div>
          <p className="font-display text-base sm:text-lg font-bold text-orange-500">
            {entry.streakWeeks}w
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Streak
          </p>
        </div>
      </div>
    </m.div>
  );
}

export function TechWeeklyClient({
  data,
}: {
  data: TechWeeklyLandingPayload;
}) {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState<string>("all");
  const [countdownText, setCountdownText] = useState<string>("");

  const isVerifiedTech =
    profile?.role === "tech_member" ||
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    Boolean(profile?.is_admin);

  const isTechHeadOrAdmin =
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    profile?.csi_id === 241 ||
    profile?.csi_id === 246 ||
    profile?.csi_id === 303 ||
    Boolean(profile?.is_admin);

  const isSuperAdmin =
    profile?.role === "super_admin" ||
    profile?.csi_id === 303 ||
    Boolean(profile?.is_admin);

  const isVerifiedRoster =
    Boolean(profile?.csi_id && profile?.role && profile.role !== "unverified") ||
    Boolean(profile?.is_admin);

  useEffect(() => {
    if (!data.currentWeek?.cutoff_at) return;
    const updateTimer = () => {
      const target = new Date(data.currentWeek!.cutoff_at).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdownText("Wednesday 09:00 IST cutoff reached (Review Window)");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setCountdownText(`${days}d ${hours}h ${mins}m left until Wed 09:00 IST lock`);
    };
    updateTimer();
    const id = window.setInterval(updateTimer, 30000);
    return () => window.clearInterval(id);
  }, [data.currentWeek]);

  const currentWeekSubmissions = useMemo(() => {
    const base = data.currentWeek
      ? data.submissions.filter((s) => s.week_id === data.currentWeek!.id)
      : data.submissions;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.summary || "").toLowerCase().includes(q) ||
        (s.author?.full_name || "").toLowerCase().includes(q) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [data.currentWeek, data.submissions, searchQuery]);

  const archiveSubmissions = useMemo(() => {
    let list = data.submissions;
    if (selectedWeekId !== "all") {
      list = list.filter((s) => s.week_id === selectedWeekId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.summary || "").toLowerCase().includes(q) ||
          (s.author?.full_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.submissions, selectedWeekId, searchQuery]);

  return (
    <PageShell variant="wide" className="space-y-8 pb-16">
      <LazyMotion features={domAnimation}>
        {/* Hero Banner */}
        <m.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/12 via-card/90 to-teal-500/8 p-6 sm:p-10 shadow-xl backdrop-blur-xl"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 rounded-full px-3 py-1">
                  <Terminal className="h-3.5 w-3.5 mr-1.5" />
                  CSI MIT-WPU Technical Wing
                </Badge>
                {data.isWindowOpen ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full px-3 py-1"
                  >
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Submissions Open · {countdownText || "Sun to Wed 09:00 IST"}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full px-3 py-1"
                  >
                    <Lock className="h-3 w-3 mr-1.5" />
                    Submissions Locked · Technical Head Review Phase
                  </Badge>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                CSI Tech Weekly
              </h1>
              <p className="font-serif text-muted-foreground text-base sm:text-lg leading-relaxed">
                Every week from Sunday to Wednesday 09:00 IST, verified CSI MIT-WPU Technical members publish deep-dives and engineering explainers. On Wednesday, Technical Heads select one official post for LinkedIn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {!user ? (
                <Button
                  asChild
                  size="lg"
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Link href="/auth/signin">Sign in with Google</Link>
                </Button>
              ) : !isVerifiedRoster ? (
                <Button
                  asChild
                  size="lg"
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Link href="/verify-csi">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Verify Your CSI ID
                  </Link>
                </Button>
              ) : (
                <>
                  {isVerifiedTech && (
                    <Button
                      asChild
                      size="lg"
                      className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                    >
                      <Link href="/tech-weekly/write">
                        <PenTool className="h-4 w-4 mr-2" />
                        {data.isWindowOpen || isSuperAdmin
                          ? "Submit This Week's Post"
                          : "View Editor"}
                      </Link>
                    </Button>
                  )}
                  {isTechHeadOrAdmin && (
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="rounded-2xl border-emerald-500/40"
                    >
                      <Link href="/tech-weekly/review">
                        <FileCheck className="h-4 w-4 mr-2 text-emerald-500" />
                        Review &amp; Pick ({currentWeekSubmissions.length})
                      </Link>
                    </Button>
                  )}
                  {isSuperAdmin && (
                    <Button asChild size="lg" variant="secondary" className="rounded-2xl">
                      <Link href="/admin">Super Admin</Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </m.section>

        {/* Unverified User Callout */}
        {user && !isVerifiedRoster && (
          <Card className="rounded-3xl border-amber-500/40 bg-amber-500/10 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-display font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  Verify your CSI MIT-WPU ID to participate
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  You are signed in with Google as an unverified reader. Enter your CSI ID and University PRN once to unlock your role.
                </p>
              </div>
              <Button asChild className="rounded-xl shrink-0">
                <Link href="/verify-csi">Verify CSI ID Now</Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Featured Post of the Week */}
        {data.featuredPick && (
          <FeaturedTechWeeklyBanner submission={data.featuredPick} />
        )}

        {/* Search & Tabs */}
        <Tabs defaultValue="this-week" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="h-11 rounded-2xl p-1 bg-muted/70 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="this-week" className="rounded-xl text-xs sm:text-sm">
                This Week ({currentWeekSubmissions.length})
              </TabsTrigger>
              <TabsTrigger value="archive" className="rounded-xl text-xs sm:text-sm">
                Archive ({data.submissions.length})
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="rounded-xl text-xs sm:text-sm">
                <Trophy className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, tag..."
                className="pl-10 rounded-2xl h-10"
              />
            </div>
          </div>

          <TabsContent value="this-week" className="space-y-6">
            {currentWeekSubmissions.length === 0 ? (
              <Card className="rounded-3xl border-border/70 bg-card/60 p-12 text-center space-y-3">
                <Terminal className="h-10 w-10 text-emerald-500 mx-auto" />
                <h3 className="font-display text-xl font-semibold">
                  No submissions for this week yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {data.isWindowOpen
                    ? "The Sunday to Wednesday 09:00 IST submission window is open. Be the first CSI Technical member to publish this week!"
                    : "Submissions are currently locked for review."}
                </p>
                {isVerifiedTech && data.isWindowOpen && (
                  <div className="pt-2">
                    <Button
                      asChild
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Link href="/tech-weekly/write">
                        Write First Submission
                      </Link>
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentWeekSubmissions.map((sub, idx) => (
                  <SubmissionCard key={sub.id} submission={sub} index={idx} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archive" className="space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                type="button"
                size="sm"
                variant={selectedWeekId === "all" ? "default" : "outline"}
                onClick={() => setSelectedWeekId("all")}
                className="rounded-full text-xs shrink-0"
              >
                All Weeks
              </Button>
              {data.allWeeks.map((week) => (
                <Button
                  key={week.id}
                  type="button"
                  size="sm"
                  variant={selectedWeekId === week.id ? "default" : "outline"}
                  onClick={() => setSelectedWeekId(week.id)}
                  className="rounded-full text-xs shrink-0 gap-1.5"
                >
                  <Calendar className="h-3 w-3" />
                  {week.week_key}
                </Button>
              ))}
            </div>

            {archiveSubmissions.length === 0 ? (
              <Card className="rounded-3xl border-border/70 bg-card/60 p-10 text-center text-muted-foreground">
                No archived submissions match your filter.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archiveSubmissions.map((sub, idx) => (
                  <SubmissionCard key={sub.id} submission={sub} index={idx} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card className="rounded-3xl border-border/70 bg-card/75 p-6">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    CSI Technical Contributors Leaderboard
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Ranked by weekly submissions, LinkedIn picks, peer reactions, and active weekly streaks.
                  </p>
                </div>
              </div>

              {data.leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Leaderboard rankings will populate as technical submissions come in.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.leaderboard.map((entry, i) => (
                    <LeaderboardRow
                      key={entry.author.id}
                      entry={entry}
                      rank={i + 1}
                    />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </LazyMotion>
    </PageShell>
  );
}
