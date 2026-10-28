"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Ban,
  CheckCircle2,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  History,
  KeyRound,
  Link2,
  Loader2,
  PenSquare,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  Unlink,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/layout/PageShell";
import { CopyForLinkedInButton } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import {
  adminAssignCsiIdentityAction,
  adminDeleteRosterEntryAction,
  adminResolveReportAction,
  adminSoftDeleteCommentAction,
  adminSoftDeleteSubmissionAction,
  adminToggleUserSuspensionAction,
  adminUpdatePlatformSettingsAction,
  adminUpsertRosterEntryAction,
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

function getRoleBadgeStyle(role?: string | null) {
  switch (role) {
    case "super_admin":
    case "tech_head":
      return "status-mark status-mark--brand";
    case "tech_member":
    case "member":
      return "status-mark";
    default:
      return "status-mark";
  }
}

export default function AdminClient({
  initialData,
}: {
  initialData: SuperAdminDashboardPayload;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<
    "all" | "verified" | "tech" | "unverified"
  >("all");
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterFilter, setRosterFilter] = useState<
    "all" | "tech" | "heads" | "claimed" | "flagged"
  >("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Manual CSI link form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [manualCsiId, setManualCsiId] = useState("");
  const [manualRole, setManualRole] = useState<CsiRole | "auto">("auto");

  // Add / Update Roster Entry state
  const [newRosterCsiId, setNewRosterCsiId] = useState("");
  const [newRosterName, setNewRosterName] = useState("");
  const [newRosterDept, setNewRosterDept] = useState("Tech");
  const [newRosterYear, setNewRosterYear] = useState("SY");
  const [newRosterPrn, setNewRosterPrn] = useState("");
  const [newRosterRole, setNewRosterRole] = useState<CsiRole | "auto">("auto");

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

  const userById = useMemo(
    () => new Map(initialData.users.map((u) => [u.id, u])),
    [initialData.users]
  );

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return initialData.users.filter((u) => {
      if (userFilter === "verified" && !u.csi_id) return false;
      if (
        userFilter === "tech" &&
        u.role !== "tech_member" &&
        u.role !== "tech_head" &&
        u.role !== "super_admin"
      ) {
        return false;
      }
      if (userFilter === "unverified" && u.csi_id) return false;
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        String(u.csi_id || "").includes(q) ||
        (u.role || "").toLowerCase().includes(q)
      );
    });
  }, [initialData.users, searchTerm, userFilter]);

  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    return initialData.roster.filter((r) => {
      if (rosterFilter === "tech" && r.dept !== "Tech") return false;
      if (
        rosterFilter === "heads" &&
        r.role !== "tech_head" &&
        r.role !== "super_admin"
      ) {
        return false;
      }
      if (rosterFilter === "claimed" && !r.claimed_by) return false;
      if (rosterFilter === "flagged" && !r.prn_missing && !r.prn_duplicate) {
        return false;
      }
      if (!q) return true;
      return (
        String(r.csi_id).includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.dept.toLowerCase().includes(q) ||
        (r.year || "").toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      );
    });
  }, [initialData.roster, rosterSearch, rosterFilter]);

  const flaggedRoster = useMemo(
    () =>
      initialData.roster.filter((r) =>
        Boolean(r.prn_missing || r.prn_duplicate)
      ),
    [initialData.roster]
  );

  const techRosterCount = useMemo(
    () => initialData.roster.filter((r) => r.dept === "Tech").length,
    [initialData.roster]
  );

  const claimedRosterCount = useMemo(
    () => initialData.roster.filter((r) => Boolean(r.claimed_by)).length,
    [initialData.roster]
  );

  const handleManualAssign = async () => {
    if (!selectedUserId) {
      toast.error("Select a user account first.");
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
          ? `Linked CSI #${parsedCsi} and synced role.`
          : "Unlinked CSI identity from user."
      );
      setManualCsiId("");
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleUpsertRoster = async () => {
    const parsedId = Number.parseInt(newRosterCsiId.trim(), 10);
    if (Number.isNaN(parsedId) || parsedId <= 0) {
      toast.error("Enter a valid numeric CSI ID.");
      return;
    }
    if (!newRosterName.trim()) {
      toast.error("Enter the member's full name.");
      return;
    }

    setBusyKey("upsert-roster");
    try {
      const res = await adminUpsertRosterEntryAction({
        csiId: parsedId,
        name: newRosterName.trim(),
        dept: newRosterDept,
        year: newRosterYear,
        prn: newRosterPrn.trim() || null,
        role: newRosterRole === "auto" ? null : newRosterRole,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to save roster member.");
        return;
      }
      toast.success(
        `Saved CSI #${parsedId} (${newRosterName.trim()}) to the roster.`
      );
      setNewRosterCsiId("");
      setNewRosterName("");
      setNewRosterPrn("");
      setNewRosterRole("auto");
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteRosterRow = async (csiId: number, name: string) => {
    setBusyKey(`del-roster-${csiId}`);
    try {
      const res = await adminDeleteRosterEntryAction({ csiId });
      if (!res.success) {
        toast.error(res.error || "Failed to delete roster entry.");
        return;
      }
      toast.success(`Removed CSI #${csiId} (${name}) from roster.`);
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
      <div className="container max-w-2xl py-20">
        <div className="panel border-destructive/40 p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="type-display text-2xl">
            Super Admin Access Required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This command console is restricted to CSI Technical Secretary &
            Super Admin (CSI ID #303).
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
    <PageShell className="py-8 space-y-8 pb-24">
        {/* Masthead */}
        <header className="space-y-5 border-b border-hairline pb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/tech-weekly"
              className="type-label link-u inline-flex items-center gap-1.5 text-muted-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Tech Weekly
            </Link>
            <span className="status-mark status-mark--brand">
              SUPER ADMIN · CSI #303
            </span>
          </div>

          <p
            className="type-script text-[clamp(2.4rem,6vw,3.25rem)] leading-none text-[var(--brand-color)]"
            aria-hidden="true"
          >
            Admin
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <h1 className="type-display text-[clamp(1.75rem,4vw,2.75rem)] text-foreground">
                Platform & Roster Command Console
              </h1>
              <p className="type-body text-muted-foreground">
                Signed in as{" "}
                <span className="font-semibold text-foreground">
                  {initialData.viewerProfile?.full_name ||
                    initialData.viewerProfile?.username}
                </span>{" "}
                · Manage CSI 2FA roster identities, Technical Head permissions
                (Darshan #241 & Tanish #246), Wednesday LinkedIn picks, and IST
                cutoff schedules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="outline" size="sm" asChild>
                <Link href="/tech-weekly/review">
                  <Award className="mr-1.5 h-4 w-4" />
                  Wednesday Review Queue
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/tech-weekly/write">
                  <PenSquare className="mr-1.5 h-4 w-4" />
                  New Tech Weekly Dispatch
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Telemetry */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="type-label text-muted-foreground">
                Registered Accounts
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--fg-line)] text-[var(--brand-color)]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="type-display text-3xl tabular-nums text-foreground">
                {initialData.users.length}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="status-mark status-mark--brand">
                  <UserCheck className="h-3 w-3" />
                  {initialData.users.filter((u) => Boolean(u.csi_id)).length}{" "}
                  verified
                </span>
                <span className="text-muted-foreground">
                  {initialData.users.filter((u) => !u.csi_id).length} unverified
                </span>
              </div>
            </div>
          </div>

          <div className="panel flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="type-label text-muted-foreground">
                Seeded CSI Roster
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--fg-line)] text-[var(--brand-color)]">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="type-display text-3xl tabular-nums text-foreground">
                {initialData.roster.length}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="status-mark status-mark--brand">
                  {techRosterCount} Tech Team
                </span>
                <span className="text-muted-foreground">
                  {claimedRosterCount} claimed · {flaggedRoster.length} flagged
                </span>
              </div>
            </div>
          </div>

          <div className="panel flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="type-label text-muted-foreground">
                Tech Weekly Posts
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--fg-line)] text-[var(--brand-color)]">
                <Terminal className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="type-display text-3xl tabular-nums text-foreground">
                {initialData.submissions.length}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="status-mark status-mark--brand">
                  {
                    initialData.submissions.filter(
                      (s) => s.status === "selected"
                    ).length
                  }{" "}
                  LinkedIn picks
                </span>
                <span className="text-muted-foreground">
                  {
                    initialData.submissions.filter(
                      (s) => s.status === "submitted"
                    ).length
                  }{" "}
                  in queue
                </span>
              </div>
            </div>
          </div>

          <div className="panel flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="type-label text-muted-foreground">
                Security & Audit
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--fg-line)] text-[var(--fg-muted)]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="type-display text-3xl tabular-nums text-foreground">
                {initialData.auditLogs.length}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                  {initialData.reports.filter((r) => r.status === "open").length}{" "}
                  open reports
                </span>
                <span className="text-muted-foreground">audit events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Command Navigation Tabs */}
        <Tabs defaultValue="roster-directory" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1.5 panel p-1.5">
            <TabsTrigger
              value="roster-directory"
              className="rounded-[var(--radius)] px-3.5 py-2 text-xs font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Database className="mr-1.5 h-3.5 w-3.5" />
              CSI Roster ({initialData.roster.length})
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-[var(--radius)] px-3.5 py-2 text-xs font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Users & Identity Linking ({initialData.users.length})
            </TabsTrigger>
            <TabsTrigger
              value="submissions"
              className="rounded-[var(--radius)] px-3.5 py-2 text-xs font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Award className="mr-1.5 h-3.5 w-3.5" />
              Tech Weekly ({initialData.submissions.length})
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-[var(--radius)] px-3.5 py-2 text-xs font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Schedule & Cutoff
            </TabsTrigger>
            <TabsTrigger
              value="moderation"
              className="rounded-[var(--radius)] px-3.5 py-2 text-xs font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
              Moderation ({initialData.reports.length})
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="rounded-[var(--radius)] px-3.5 py-2 text-xs font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <History className="mr-1.5 h-3.5 w-3.5" />
              Audit Log ({initialData.auditLogs.length})
            </TabsTrigger>
            <TabsTrigger
              value="legacy"
              className="rounded-[var(--radius)] px-3.5 py-2 text-xs font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Open Blog ({initialData.legacyPosts.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CSI ROSTER DIRECTORY & ADD/EDIT ROSTER MEMBER */}
          <TabsContent value="roster-directory" className="space-y-6">
            {/* Add / Update Roster Member Bar */}
            <div className="panel space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    Add or Update CSI Roster Member (2FA PRN Provisioning)
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add a new CSI member or update an existing member&apos;s PRN
                    and role. PRNs are hashed with HMAC-SHA256 before storage.
                  </p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  241 = Darshan (Tech Head) · 246 = Tanish Bhavsar (Tech Head) ·
                  303 = Aryan (Super Admin)
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    CSI ID
                  </label>
                  <Input
                    value={newRosterCsiId}
                    onChange={(e) => setNewRosterCsiId(e.target.value)}
                    placeholder="e.g. 241"
                    className="h-9 rounded-[var(--radius)] font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </label>
                  <Input
                    value={newRosterName}
                    onChange={(e) => setNewRosterName(e.target.value)}
                    placeholder="e.g. Darshan Nayak"
                    className="h-9 rounded-[var(--radius)] text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Dept & Year
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={newRosterDept}
                      onChange={(e) => setNewRosterDept(e.target.value)}
                      className="h-9 flex-1 rounded-[var(--radius)] border border-input bg-background px-2.5 text-xs font-medium"
                    >
                      <option value="Tech">Tech</option>
                      <option value="Event">Event</option>
                      <option value="Design">Design</option>
                      <option value="Public Relations">PR</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Management">Management</option>
                    </select>
                    <select
                      value={newRosterYear}
                      onChange={(e) => setNewRosterYear(e.target.value)}
                      className="h-9 w-16 rounded-[var(--radius)] border border-input bg-background px-2 text-xs font-medium"
                    >
                      <option value="FY">FY</option>
                      <option value="SY">SY</option>
                      <option value="TY">TY</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    University PRN (2FA)
                  </label>
                  <Input
                    value={newRosterPrn}
                    onChange={(e) => setNewRosterPrn(e.target.value)}
                    placeholder="10-digit PRN"
                    className="h-9 rounded-[var(--radius)] font-mono text-xs"
                  />
                </div>

                <Button
                  type="button"
                  disabled={busyKey === "upsert-roster"}
                  onClick={handleUpsertRoster}
                  className="h-9 rounded-[var(--radius)] text-xs font-semibold"
                >
                  {busyKey === "upsert-roster" ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Save to Roster
                </Button>
              </div>
            </div>

            {/* Roster Table Card */}
            <div className="panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: "all", label: `All (${initialData.roster.length})` },
                      { id: "tech", label: `Tech Team (${techRosterCount})` },
                      { id: "heads", label: "Heads & Admin (3)" },
                      {
                        id: "claimed",
                        label: `Claimed (${claimedRosterCount})`,
                      },
                      {
                        id: "flagged",
                        label: `Flagged (${flaggedRoster.length})`,
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRosterFilter(tab.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        rosterFilter === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Search CSI ID, name, dept..."
                    className="h-9 rounded-[var(--radius)] pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">CSI ID</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Dept & Year</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">2FA PRN Status</th>
                      <th className="py-3 px-4">Claimed Account</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {filteredRoster.map((r) => {
                      const claimedUser = r.claimed_by
                        ? userById.get(r.claimed_by)
                        : null;
                      return (
                        <tr
                          key={r.csi_id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-foreground">
                            #{r.csi_id}
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {r.name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-foreground">
                              {r.dept}
                            </span>
                            {r.year && (
                              <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                {r.year}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={getRoleBadgeStyle(r.role)}
                            >
                              {r.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {r.prn_duplicate ? (
                              <span className="status-mark status-mark--warn">
                                <AlertTriangle className="h-3 w-3" />
                                Duplicate PRN (Manual Link)
                              </span>
                            ) : r.prn_missing ? (
                              <span className="status-mark status-mark--warn">
                                <KeyRound className="h-3 w-3" />
                                Missing PRN (Manual Link)
                              </span>
                            ) : (
                              <span className="status-mark status-mark--brand">
                                <CheckCircle2 className="h-3 w-3" />
                                HMAC-SHA256 Ready
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {claimedUser ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={claimedUser.avatar_url || ""}
                                  />
                                  <AvatarFallback className="text-[9px]">
                                    {claimedUser.username[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">
                                  @{claimedUser.username}
                                </span>
                              </div>
                            ) : r.claimed_by ? (
                              <span className="font-mono text-[11px] text-[var(--brand-color)]">
                                Claimed
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Unclaimed
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 rounded-lg px-2 text-xs"
                                onClick={() => {
                                  setNewRosterCsiId(String(r.csi_id));
                                  setNewRosterName(r.name);
                                  setNewRosterDept(r.dept);
                                  setNewRosterYear(r.year || "SY");
                                  window.scrollTo({
                                    top: 220,
                                    behavior: "smooth",
                                  });
                                }}
                              >
                                Edit
                              </Button>
                              {r.csi_id !== 303 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={
                                    busyKey === `del-roster-${r.csi_id}`
                                  }
                                  onClick={() =>
                                    handleDeleteRosterRow(r.csi_id, r.name)
                                  }
                                  className="h-7 rounded-lg px-2 text-xs text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredRoster.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          No roster entries match your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: USERS & MANUAL IDENTITY LINKING */}
          <TabsContent value="users" className="space-y-6">
            <div className="panel space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" />
                    Manual CSI Identity Link / Reassign / Role Override
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manually link or reassign any CSI ID to a Google-signed-in
                    user account, or override their role. All changes are logged
                    in the audit trail.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "241", label: "#241 Darshan (Tech Head)" },
                    { id: "246", label: "#246 Tanish B. (Tech Head)" },
                    { id: "230", label: "#230 Rutva (SY)" },
                    { id: "307", label: "#307 Rutva (TY)" },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setManualCsiId(chip.id)}
                      className="rounded-lg border border-border bg-muted/50 px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Target User Account
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="h-9 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-xs font-medium"
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
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    CSI ID (Blank to Unlink)
                  </label>
                  <Input
                    value={manualCsiId}
                    onChange={(e) => setManualCsiId(e.target.value)}
                    placeholder="e.g. 241, 246, 303"
                    className="h-9 rounded-[var(--radius)] font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Role Override
                  </label>
                  <select
                    value={manualRole}
                    onChange={(e) =>
                      setManualRole(e.target.value as CsiRole | "auto")
                    }
                    className="h-9 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-xs font-medium"
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
                  className="h-9 rounded-[var(--radius)] text-xs font-semibold"
                >
                  {busyKey === "manual-assign" && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  Apply Identity & Role
                </Button>
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: "all", label: `All (${initialData.users.length})` },
                      {
                        id: "verified",
                        label: `Verified CSI (${
                          initialData.users.filter((u) => Boolean(u.csi_id))
                            .length
                        })`,
                      },
                      { id: "tech", label: "Tech Writers & Heads" },
                      {
                        id: "unverified",
                        label: `Unverified (${
                          initialData.users.filter((u) => !u.csi_id).length
                        })`,
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUserFilter(f.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        userFilter === f.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, @user, CSI ID..."
                    className="h-9 rounded-[var(--radius)] pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="divide-y divide-border/60">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={u.avatar_url || ""} />
                        <AvatarFallback className="text-xs font-semibold">
                          {(u.full_name || u.username)[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {u.full_name || u.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @{u.username}
                          </span>
                          <span
                            className={getRoleBadgeStyle(u.role)}
                          >
                            {u.role || "unverified"}
                          </span>
                          {u.csi_id && (
                            <span className="status-mark status-mark--brand">
                              CSI #{u.csi_id}
                            </span>
                          )}
                          {u.dept && (
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {u.dept} {u.year ? `· ${u.year}` : ""}
                            </span>
                          )}
                          {u.is_suspended && (
                            <Badge variant="destructive" className="text-[10px]">
                              Suspended
                            </Badge>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground truncate">
                          UUID: {u.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-[var(--radius)] text-xs"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setManualCsiId(u.csi_id ? String(u.csi_id) : "");
                          window.scrollTo({ top: 200, behavior: "smooth" });
                        }}
                      >
                        <Link2 className="mr-1.5 h-3.5 w-3.5" />
                        Assign CSI ID
                      </Button>

                      {u.csi_id && u.csi_id !== 303 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-[var(--radius)] text-xs"
                          disabled={busyKey === `unlink-${u.id}`}
                          onClick={() => handleUnlinkUser(u.id)}
                        >
                          <Unlink className="mr-1.5 h-3.5 w-3.5" />
                          Unlink
                        </Button>
                      )}

                      {u.csi_id !== 303 && (
                        <Button
                          type="button"
                          size="sm"
                          variant={u.is_suspended ? "outline" : "destructive"}
                          className="h-8 rounded-[var(--radius)] text-xs"
                          disabled={busyKey === `suspend-${u.id}`}
                          onClick={() =>
                            handleToggleSuspend(u.id, !u.is_suspended)
                          }
                        >
                          <Ban className="mr-1.5 h-3.5 w-3.5" />
                          {u.is_suspended ? "Unsuspend" : "Suspend"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: TECH WEEKLY SUBMISSIONS & PICK OVERRIDE */}
          <TabsContent value="submissions" className="space-y-4">
            {initialData.submissions.length === 0 ? (
              <div className="panel space-y-3 p-12 text-center">
                <Terminal className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold">
                  No Tech Weekly dispatches submitted yet
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Once CSI Technical members submit their Sunday-to-Wednesday
                  articles, they will appear here for curation and LinkedIn pick
                  selection.
                </p>
              </div>
            ) : (
              initialData.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="panel flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          sub.status === "selected" ? "default" : "outline"
                        }
                        className="uppercase text-[10px]"
                      >
                        {sub.status}
                      </Badge>
                      {sub.is_deleted && (
                        <Badge variant="destructive" className="text-[10px]">
                          Soft-Deleted
                        </Badge>
                      )}
                      {sub.week && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {sub.week.title || sub.week.week_key}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        · {sub.word_count} words
                      </span>
                    </div>

                    <Link
                      href={`/tech-weekly/${sub.slug}`}
                      className="font-display text-lg font-bold hover:text-primary transition-colors inline-flex items-center gap-1.5"
                    >
                      {sub.title}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>

                    <p className="text-xs text-muted-foreground">
                      By{" "}
                      <strong className="text-foreground">
                        {sub.author?.full_name || sub.author?.username}
                      </strong>{" "}
                      (CSI #{sub.author?.csi_id ?? "-"})
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
                        className="h-8 rounded-[var(--radius)] text-xs font-semibold"
                        disabled={busyKey === `pick-${sub.id}`}
                        onClick={() => handleOverridePick(sub.id, sub.title)}
                      >
                        <Award className="mr-1.5 h-3.5 w-3.5" />
                        Set as Weekly Pick
                      </Button>
                    )}

                    {!sub.is_deleted && sub.status !== "approved" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-[var(--radius)] text-xs"
                        onClick={async () => {
                          await reviewTechSubmissionAction({
                            submissionId: sub.id,
                            status: "approved",
                          });
                          toast.success("Submission approved.");
                          router.refresh();
                        }}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[var(--brand-color)]" />
                        Approve
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-[var(--radius)] text-xs"
                      asChild
                    >
                      <Link href={`/tech-weekly/write?id=${sub.id}`}>
                        Edit
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant={sub.is_deleted ? "outline" : "destructive"}
                      className="h-8 rounded-[var(--radius)] text-xs"
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
                </div>
              ))
            )}
          </TabsContent>

          {/* TAB 4: PLATFORM SETTINGS */}
          <TabsContent value="settings">
            <div className="panel space-y-6 p-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  CSI Tech Weekly Schedule & Cutoff Engine
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure the weekly IST cutoff schedule, submission window
                  override, and whether non-Tech roster members can post
                  comments.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cutoff Day (IST)
                  </label>
                  <select
                    value={cutoffDay}
                    onChange={(e) =>
                      setCutoffDay(Number.parseInt(e.target.value, 10))
                    }
                    className="w-full h-10 rounded-[var(--radius)] border border-input bg-background px-3 text-xs font-medium"
                  >
                    {DAY_NAMES.map((label, idx) => (
                      <option key={label} value={idx}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cutoff Hour (0-23 IST)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={cutoffHour}
                    onChange={(e) =>
                      setCutoffHour(Number.parseInt(e.target.value || "0", 10))
                    }
                    className="h-10 rounded-[var(--radius)] font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cutoff Minute (0-59 IST)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={cutoffMinute}
                    onChange={(e) =>
                      setCutoffMinute(
                        Number.parseInt(e.target.value || "0", 10)
                      )
                    }
                    className="h-10 rounded-[var(--radius)] font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Submissions Window Override
                  </label>
                  <select
                    value={submissionsOverride}
                    onChange={(e) =>
                      setSubmissionsOverride(
                        e.target.value as "auto" | "force_open" | "force_closed"
                      )
                    }
                    className="w-full h-10 rounded-[var(--radius)] border border-input bg-background px-3 text-xs font-medium"
                  >
                    <option value="auto">
                      Auto (Open Fri 09:00 IST to Cutoff)
                    </option>
                    <option value="force_open">
                      Force Open (Allow submissions now)
                    </option>
                    <option value="force_closed">
                      Force Closed (Lock submissions now)
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Featured LinkedIn Picks Per Week
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={postsPerWeek}
                    onChange={(e) =>
                      setPostsPerWeek(
                        Number.parseInt(e.target.value || "1", 10)
                      )
                    }
                    className="h-10 rounded-[var(--radius)] font-mono text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    id="allow-member-comments"
                    type="checkbox"
                    checked={allowMemberComments}
                    onChange={(e) => setAllowMemberComments(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label
                    htmlFor="allow-member-comments"
                    className="text-xs font-medium cursor-pointer"
                  >
                    Allow verified non-Tech CSI members to comment
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  disabled={busyKey === "save-settings"}
                  onClick={handleSaveSettings}
                  className="rounded-[var(--radius)] text-xs font-semibold"
                >
                  {busyKey === "save-settings" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Platform Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 5: REPORTS & COMMENTS MODERATION */}
          <TabsContent value="moderation" className="space-y-6">
            <div className="panel space-y-4 p-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  User Reports ({initialData.reports.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Resolve or dismiss content reports submitted by members.
                </p>
              </div>
              {initialData.reports.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No reports submitted.
                </p>
              ) : (
                initialData.reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--fg-line)] p-3.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            rep.status === "open" ? "destructive" : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {rep.status}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          {rep.target_type} · {rep.target_id}
                        </span>
                      </div>
                      <p className="text-sm">{rep.reason}</p>
                    </div>
                    {rep.status === "open" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-[var(--radius)] text-xs"
                          onClick={async () => {
                            await adminResolveReportAction({
                              reportId: rep.id,
                              status: "resolved",
                            });
                            toast.success("Report resolved.");
                            router.refresh();
                          }}
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-[var(--radius)] text-xs"
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
            </div>

            <div className="panel space-y-4 p-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Recent Tech Weekly Comments ({initialData.comments.length})
                </h2>
              </div>
              {initialData.comments.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No comments yet.
                </p>
              ) : (
                initialData.comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--fg-line)] p-3.5"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">
                          {c.author?.full_name || c.author?.username}
                        </strong>{" "}
                        · {new Date(c.created_at).toLocaleString()}
                        {c.is_deleted && (
                          <Badge
                            variant="destructive"
                            className="ml-2 text-[10px]"
                          >
                            Deleted
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm">{c.content}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={c.is_deleted ? "outline" : "destructive"}
                      className="h-8 rounded-[var(--radius)] text-xs"
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
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 6: AUDIT LOG */}
          <TabsContent value="audit">
            <div className="panel space-y-4 p-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Immutable Security & Curation Audit Log
                </h2>
                <p className="text-xs text-muted-foreground">
                  Every role claim, manual CSI link, weekly LinkedIn pick, and
                  moderation action is recorded with actor and state snapshots.
                </p>
              </div>
              <div className="space-y-2.5">
                {initialData.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-[var(--radius)] border border-[var(--fg-line)] bg-[hsl(var(--surface))] p-3.5 text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {log.action}
                        </Badge>
                        <span className="font-mono text-muted-foreground">
                          {log.target_type} ({log.target_id || "-"})
                        </span>
                      </div>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Actor:{" "}
                      <strong className="text-foreground">
                        {log.actor
                          ? `${log.actor.full_name || log.actor.username} (CSI #${
                              log.actor.csi_id ?? "-"
                            })`
                          : log.actor_id || "system"}
                      </strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 7: LEGACY OPEN BLOG POSTS */}
          <TabsContent value="legacy" className="space-y-3">
            {initialData.legacyPosts.map((post) => (
              <div
                key={post.id}
                className="panel flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <Link
                    href={`/post/${post.slug}`}
                    className="font-display font-semibold hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    By {post.author?.full_name || post.author?.username} ·{" "}
                    {post.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-[var(--radius)] text-xs"
                    asChild
                  >
                    <Link href={`/write?edit=${post.id}`}>Edit</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 rounded-[var(--radius)] text-xs"
                    onClick={async () => {
                      const res = await deletePost(post.id);
                      if (res.error) {
                        toast.error(res.error);
                        return;
                      }
                      toast.success("Post deleted.");
                      router.refresh();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </PageShell>
  );
}
