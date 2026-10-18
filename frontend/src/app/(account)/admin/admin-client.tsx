"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Ban,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  History,
  Link2,
  Loader2,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Trash2,
  Unlink,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/layout/PageShell";
import { CopyForLinkedInButton } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import {
  adminAssignCsiIdentityAction,
  adminResolveReportAction,
  adminSoftDeleteCommentAction,
  adminSoftDeleteSubmissionAction,
  adminToggleUserSuspensionAction,
  adminUpdatePlatformSettingsAction,
  type SuperAdminDashboardPayload,
} from "@/features/data/admin-actions";
import {
  reviewTechSubmissionAction,
  selectTechWeeklyPickAction,
} from "@/features/data/tech-weekly-actions";
import { deletePost } from "@/features/data/database-operations";
import { toast } from "sonner";
import type { CsiRole } from "@/types/database";

const DAY_NAMES = [
  "Sunday (0)",
  "Monday (1)",
  "Tuesday (2)",
  "Wednesday (3)",
  "Thursday (4)",
  "Friday (5)",
  "Saturday (6)",
];

export default function AdminClient({
  initialData,
}: {
  initialData: SuperAdminDashboardPayload;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Manual CSI link form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [manualCsiId, setManualCsiId] = useState("");
  const [manualRole, setManualRole] = useState<CsiRole | "auto">("auto");

  // Platform settings form state
  const [cutoffDay, setCutoffDay] = useState(initialData.settings.cutoff_day);
  const [cutoffHour, setCutoffHour] = useState(
    initialData.settings.cutoff_hour_ist
  );
  const [cutoffMinute, setCutoffMinute] = useState(
    initialData.settings.cutoff_minute_ist
  );
  const [postsPerWeek, setPostsPerWeek] = useState(
    initialData.settings.posts_per_week
  );
  const [allowMemberComments, setAllowMemberComments] = useState(
    initialData.settings.allow_member_comments
  );
  const [submissionsOverride, setSubmissionsOverride] = useState<
    "auto" | "force_open" | "force_closed"
  >(initialData.settings.submissions_override);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return initialData.users;
    return initialData.users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        String(u.csi_id || "").includes(q) ||
        (u.role || "").toLowerCase().includes(q)
    );
  }, [initialData.users, searchTerm]);

  const flaggedRoster = useMemo(
    () =>
      initialData.roster.filter((r) =>
        Boolean(r.prn_missing || r.prn_duplicate)
      ),
    [initialData.roster]
  );

  const handleManualAssign = async () => {
    if (!selectedUserId) {
      toast.error("Select a user first.");
      return;
    }
    const parsedCsi = manualCsiId.trim()
      ? Number.parseInt(manualCsiId.trim(), 10)
      : null;
    if (manualCsiId.trim() && (Number.isNaN(parsedCsi!) || parsedCsi! <= 0)) {
      toast.error("Enter a valid positive CSI ID or leave blank to unlink.");
      return;
    }

    setBusyKey("manual-assign");
    try {
      const res = await adminAssignCsiIdentityAction({
        targetUserId: selectedUserId,
        csiId: parsedCsi,
        overrideRole: manualRole === "auto" ? null : manualRole,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to update CSI identity.");
        return;
      }
      toast.success(
        parsedCsi
          ? `Linked CSI #${parsedCsi} and updated role (audit logged).`
          : "Unlinked CSI identity from user (audit logged)."
      );
      setManualCsiId("");
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleUnlinkUser = async (userId: string) => {
    setBusyKey(`unlink-${userId}`);
    try {
      const res = await adminAssignCsiIdentityAction({
        targetUserId: userId,
        csiId: null,
        overrideRole: "unverified",
      });
      if (!res.success) {
        toast.error(res.error || "Could not unlink CSI ID.");
        return;
      }
      toast.success("CSI ID unlinked and logged.");
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleSuspend = async (userId: string, suspend: boolean) => {
    setBusyKey(`suspend-${userId}`);
    try {
      const res = await adminToggleUserSuspensionAction({
        targetUserId: userId,
        suspend,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to update suspension state.");
        return;
      }
      toast.success(suspend ? "User suspended." : "User unsuspended.");
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleSoftDeleteSubmission = async (
    submissionId: string,
    restore: boolean
  ) => {
    setBusyKey(`sub-del-${submissionId}`);
    try {
      const res = await adminSoftDeleteSubmissionAction({
        submissionId,
        restore,
      });
      if (!res.success) {
        toast.error(res.error || "Action failed.");
        return;
      }
      toast.success(
        restore ? "Submission restored." : "Submission soft-deleted."
      );
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleOverridePick = async (submissionId: string, title: string) => {
    setBusyKey(`pick-${submissionId}`);
    try {
      const res = await selectTechWeeklyPickAction({
        submissionId,
        reviewNote: "Selected by Super Admin override.",
      });
      if (!res.success) {
        toast.error(res.error || "Could not select weekly pick.");
        return;
      }
      toast.success(`"${title}" set as the Weekly LinkedIn Pick!`);
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveSettings = async () => {
    setBusyKey("save-settings");
    try {
      const res = await adminUpdatePlatformSettingsAction({
        cutoff_day: cutoffDay,
        cutoff_hour_ist: cutoffHour,
        cutoff_minute_ist: cutoffMinute,
        posts_per_week: postsPerWeek,
        allow_member_comments: allowMemberComments,
        submissions_override: submissionsOverride,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to save settings.");
        return;
      }
      toast.success("Platform settings updated and logged in audit trail.");
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  if (!initialData.authorized) {
    return (
      <div className="container max-w-3xl py-20">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h1 className="font-display text-2xl font-bold">
            Super Admin Access Required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This control center is restricted to CSI Technical Secretary & Super
            Admin (CSI ID 303).
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/tech-weekly">Go to CSI Tech Weekly</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <PageShell className="py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1.5">
            <Link
              href="/tech-weekly"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              CSI Tech Weekly
            </Link>
            <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2.5">
              <Shield className="h-6 w-6 text-primary" />
              Super Admin Command Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Signed in as{" "}
              <strong className="text-foreground">
                {initialData.viewerProfile?.full_name ||
                  initialData.viewerProfile?.username}
              </strong>{" "}
              (CSI #{initialData.viewerProfile?.csi_id ?? 303} · super_admin)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/tech-weekly/review">
                <Award className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Wednesday Review Queue
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/tech-weekly/write">Write Tech Weekly Post</Link>
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Registered Profiles
              </p>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums">
                {initialData.users.length}
              </p>
              <p className="mt-1 text-xs text-primary font-medium">
                {initialData.users.filter((u) => Boolean(u.csi_id)).length}{" "}
                verified CSI accounts
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Seeded CSI Roster
              </p>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums">
                {initialData.roster.length}
              </p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {flaggedRoster.length} flagged rows (manual link only)
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Tech Weekly Submissions
              </p>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums">
                {initialData.submissions.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {
                  initialData.submissions.filter((s) => s.status === "selected")
                    .length
                }{" "}
                weekly LinkedIn picks
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Open Reports & Audit Log
              </p>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums">
                {
                  initialData.reports.filter((r) => r.status === "open").length
                }
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {initialData.auditLogs.length} recent audit events
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="roster" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1 rounded-md border border-border">
            <TabsTrigger value="roster" className="rounded">
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Users & CSI Roster
            </TabsTrigger>
            <TabsTrigger value="submissions" className="rounded">
              <Award className="mr-1.5 h-3.5 w-3.5" />
              Tech Weekly ({initialData.submissions.length})
            </TabsTrigger>
            <TabsTrigger value="moderation" className="rounded">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
              Reports & Comments
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded">
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Platform Settings
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded">
              <History className="mr-1.5 h-3.5 w-3.5" />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="legacy" className="rounded">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Open Blog ({initialData.legacyPosts.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: USERS & CSI ROSTER LINKING */}
          <TabsContent value="roster" className="space-y-6">
            <Card className="border-emerald-500/30 bg-card/95">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-emerald-500" />
                  Manual CSI Identity Link / Reassign / Role Override
                </CardTitle>
                <CardDescription>
                  Manually link or reassign any CSI ID (including flagged roster
                  rows like duplicate PRNs 230 & 307 or missing PRNs) and
                  override roles. Every change is recorded in the audit log.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Target User Account
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select user account...</option>
                    {initialData.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username} (@{u.username}){" "}
                        {u.csi_id ? `[CSI #${u.csi_id}]` : "[Unverified]"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    CSI ID (Blank to Unlink)
                  </label>
                  <Input
                    value={manualCsiId}
                    onChange={(e) => setManualCsiId(e.target.value)}
                    placeholder="e.g. 241, 246, 303"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Role Override
                  </label>
                  <select
                    value={manualRole}
                    onChange={(e) =>
                      setManualRole(e.target.value as CsiRole | "auto")
                    }
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="auto">Auto from Roster CSI ID</option>
                    <option value="super_admin">super_admin (303)</option>
                    <option value="tech_head">tech_head (241, 246)</option>
                    <option value="tech_member">tech_member (Tech Dept)</option>
                    <option value="member">member (Non-Tech Dept)</option>
                    <option value="unverified">unverified</option>
                  </select>
                </div>

                <Button
                  type="button"
                  disabled={busyKey === "manual-assign"}
                  onClick={handleManualAssign}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                >
                  {busyKey === "manual-assign" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Apply Identity & Role
                </Button>
              </CardContent>
            </Card>

            {flaggedRoster.length > 0 && (
              <Card className="border-amber-500/40 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    Flagged Roster Rows Requiring Super Admin Verification (
                    {flaggedRoster.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {flaggedRoster.map((r) => (
                    <div
                      key={r.csi_id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-background/60 px-3 py-2"
                    >
                      <div>
                        <strong>CSI #{r.csi_id}</strong> · {r.name} ({r.dept} ·{" "}
                        {r.year || "N/A"}) · Role: <code>{r.role}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-amber-400">
                          {r.prn_duplicate
                            ? "Duplicate PRN (Manual Link Only)"
                            : "Missing PRN (Manual Link Only)"}
                        </Badge>
                        {r.claimed_by ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400">
                            Claimed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Unclaimed</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-border/70 bg-card/90">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    User Accounts & Verified Roles
                  </CardTitle>
                  <CardDescription>
                    Manage user roles, unlink CSI IDs, or suspend accounts.
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, @user, CSI ID..."
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/50 p-3.5 text-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {u.full_name || u.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{u.username}
                        </span>
                        <Badge variant="outline" className="uppercase text-[10px]">
                          {u.role || "unverified"}
                        </Badge>
                        {u.csi_id && (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                            CSI #{u.csi_id} ({u.dept || "Tech"}
                            {u.year ? ` · ${u.year}` : ""})
                          </Badge>
                        )}
                        {u.is_suspended && (
                          <Badge variant="destructive" className="text-[10px]">
                            Suspended
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        UUID: {u.id}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setManualCsiId(u.csi_id ? String(u.csi_id) : "");
                          setManualRole(u.role || "auto");
                        }}
                      >
                        Edit Link
                      </Button>

                      {u.csi_id && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyKey === `unlink-${u.id}`}
                          onClick={() => handleUnlinkUser(u.id)}
                        >
                          <Unlink className="mr-1.5 h-3.5 w-3.5" />
                          Unlink CSI
                        </Button>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        variant={u.is_suspended ? "outline" : "destructive"}
                        disabled={busyKey === `suspend-${u.id}`}
                        onClick={() =>
                          handleToggleSuspend(u.id, !u.is_suspended)
                        }
                      >
                        <Ban className="mr-1.5 h-3.5 w-3.5" />
                        {u.is_suspended ? "Unsuspend" : "Suspend"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: TECH WEEKLY SUBMISSIONS */}
          <TabsContent value="submissions" className="space-y-4">
            {initialData.submissions.map((sub) => (
              <m.div
                key={sub.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
                  sub.is_deleted
                    ? "border-destructive/40 bg-destructive/5 opacity-75"
                    : sub.status === "selected"
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-border/70 bg-card/90"
                }`}
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="uppercase text-[10px]">{sub.status}</Badge>
                    {sub.is_deleted && (
                      <Badge variant="destructive" className="text-[10px]">
                        Soft-Deleted
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {sub.week?.title || "Weekly Cycle"} · {sub.word_count} words
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold">
                    <Link
                      href={`/tech-weekly/${sub.slug}`}
                      className="hover:underline"
                    >
                      {sub.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    By {sub.author?.full_name || sub.author?.username} (CSI #
                    {sub.author?.csi_id ?? "N/A"})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {sub.status === "selected" && (
                    <CopyForLinkedInButton submission={sub} size="sm" />
                  )}

                  {!sub.is_deleted && sub.status !== "selected" && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyKey === `pick-${sub.id}`}
                      onClick={() => handleOverridePick(sub.id, sub.title)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Award className="mr-1.5 h-3.5 w-3.5" />
                      Override as Weekly Pick
                    </Button>
                  )}

                  {!sub.is_deleted && sub.status !== "approved" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await reviewTechSubmissionAction({
                          submissionId: sub.id,
                          status: "approved",
                        });
                        toast.success("Submission approved.");
                        router.refresh();
                      }}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                      Approve
                    </Button>
                  )}

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tech-weekly/write?id=${sub.id}`}>Edit</Link>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant={sub.is_deleted ? "outline" : "destructive"}
                    disabled={busyKey === `sub-del-${sub.id}`}
                    onClick={() =>
                      handleSoftDeleteSubmission(sub.id, sub.is_deleted)
                    }
                  >
                    {sub.is_deleted ? (
                      <>
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Restore
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Soft Delete
                      </>
                    )}
                  </Button>
                </div>
              </m.div>
            ))}
          </TabsContent>

          {/* TAB 3: MODERATION & REPORTS */}
          <TabsContent value="moderation" className="space-y-6">
            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="text-lg">
                  Reported Content ({initialData.reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {initialData.reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No content reports submitted yet.
                  </p>
                ) : (
                  initialData.reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-4 text-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="uppercase text-[10px]">
                            {rep.target_type}
                          </Badge>
                          <Badge
                            variant={
                              rep.status === "open" ? "destructive" : "secondary"
                            }
                            className="uppercase text-[10px]"
                          >
                            {rep.status}
                          </Badge>
                        </div>
                        <p className="font-medium">{rep.reason}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Target ID: {rep.target_id}
                        </p>
                      </div>

                      {rep.status === "open" && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await adminResolveReportAction({
                                reportId: rep.id,
                                status: "resolved",
                              });
                              toast.success("Report marked resolved.");
                              router.refresh();
                            }}
                          >
                            Mark Resolved
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await adminResolveReportAction({
                                reportId: rep.id,
                                status: "dismissed",
                              });
                              toast.success("Report dismissed.");
                              router.refresh();
                            }}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="text-lg">
                  Recent Tech Weekly Comments ({initialData.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {initialData.comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-3.5 text-sm"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <strong className="text-foreground">
                          {c.author?.full_name || c.author?.username}
                        </strong>
                        {c.is_deleted && (
                          <Badge variant="destructive" className="text-[10px]">
                            Soft-Deleted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{c.content}</p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={c.is_deleted ? "outline" : "destructive"}
                      onClick={async () => {
                        await adminSoftDeleteCommentAction({
                          commentId: c.id,
                          restore: c.is_deleted,
                        });
                        toast.success(
                          c.is_deleted
                            ? "Comment restored."
                            : "Comment soft-deleted."
                        );
                        router.refresh();
                      }}
                    >
                      {c.is_deleted ? "Restore" : "Soft Delete"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: PLATFORM SETTINGS */}
          <TabsContent value="settings">
            <Card className="border-border/70 bg-card/90 max-w-2xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  CSI Tech Weekly Schedule & Rules
                </CardTitle>
                <CardDescription>
                  Configure the weekly IST submission cutoff, posts-per-week
                  limit, and emergency window override. Enforced directly inside
                  Postgres triggers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Cutoff Day (IST)
                    </label>
                    <select
                      value={cutoffDay}
                      onChange={(e) => setCutoffDay(Number(e.target.value))}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      {DAY_NAMES.map((label, idx) => (
                        <option key={label} value={idx}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Cutoff Hour IST (0-23)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={cutoffHour}
                      onChange={(e) => setCutoffHour(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Cutoff Minute IST
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={cutoffMinute}
                      onChange={(e) => setCutoffMinute(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Max Posts Per Member / Week
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={postsPerWeek}
                      onChange={(e) => setPostsPerWeek(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Submission Window Override
                    </label>
                    <select
                      value={submissionsOverride}
                      onChange={(e) =>
                        setSubmissionsOverride(
                          e.target.value as "auto" | "force_open" | "force_closed"
                        )
                      }
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      <option value="auto">
                        Auto (Sunday 00:00 to Cutoff IST)
                      </option>
                      <option value="force_open">Force Open Immediately</option>
                      <option value="force_closed">
                        Force Closed Immediately
                      </option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMemberComments}
                    onChange={(e) => setAllowMemberComments(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span>
                    Allow verified non-Tech CSI members (`role = member`) to
                    post comments on Tech Weekly articles
                  </span>
                </label>

                <Button
                  type="button"
                  disabled={busyKey === "save-settings"}
                  onClick={handleSaveSettings}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {busyKey === "save-settings" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Platform Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: AUDIT LOG */}
          <TabsContent value="audit" className="space-y-3">
            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="text-lg">
                  Immutable Security & Curation Audit Log
                </CardTitle>
                <CardDescription>
                  Tracks CSI identity claims, failed PRN attempts, weekly
                  LinkedIn pick selections/replacements, and admin actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {initialData.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-border/60 bg-background/50 p-3.5 text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {log.action}
                        </Badge>
                        <span className="font-medium">
                          Actor:{" "}
                          {log.actor
                            ? `${log.actor.full_name || log.actor.username} (CSI #${log.actor.csi_id ?? "N/A"})`
                            : log.actor_id || "System"}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}{" "}
                        IST
                      </span>
                    </div>
                    <div className="text-muted-foreground font-mono">
                      Target: {log.target_type || "n/a"} ({log.target_id || "n/a"}
                      )
                    </div>
                    {(log.before_state || log.after_state) && (
                      <pre className="rounded-xl bg-muted/60 p-2.5 overflow-x-auto text-[11px]">
                        {JSON.stringify(
                          {
                            before: log.before_state,
                            after: log.after_state,
                          },
                          null,
                          2
                        )}
                      </pre>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: LEGACY OPEN BLOG POSTS */}
          <TabsContent value="legacy" className="space-y-3">
            {initialData.legacyPosts.map((post) => (
              <div
                key={post.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/90 p-4 text-sm"
              >
                <div>
                  <Link
                    href={`/post/${post.slug}`}
                    className="font-semibold hover:underline inline-flex items-center gap-1.5"
                  >
                    {post.title}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    By {post.author?.full_name || post.author?.username} ·
                    Status: {post.status}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await deletePost(post.id);
                    toast.success("Legacy post deleted.");
                    router.refresh();
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </PageShell>
    </LazyMotion>
  );
}
