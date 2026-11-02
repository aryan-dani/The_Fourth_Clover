"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/auth-context";
import {
  verifyCsiIdentityAction,
  syncUserVerificationStatusAction,
} from "@/features/data/csi-verification-actions";
import { TechWeeklyGuide } from "@/components/tech-weekly/TechWeeklyGuide";
import { getCapabilities } from "@/lib/roles";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Lock,
  PenTool,
} from "lucide-react";
import { toast } from "sonner";

function formatRoleLabel(role?: string | null): string {
  switch (role) {
    case "super_admin":
      return "Super Admin (Technical Secretary)";
    case "tech_head":
      return "CSI Technical Head";
    case "tech_member":
      return "CSI Technical Member";
    case "member":
      return "Verified CSI Member";
    default:
      return "Unverified Account";
  }
}

export default function VerifyCsiPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [csiIdInput, setCsiIdInput] = useState("");
  const [prnInput, setPrnInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const runSync = async () => {
      if (loading) return;
      if (!user) {
        if (active) setSyncing(false);
        return;
      }
      const res = await syncUserVerificationStatusAction();
      if (res.verified && !profile?.csi_id) {
        await refreshProfile();
      }
      if (active) setSyncing(false);
    };
    void runSync();
    return () => {
      active = false;
    };
  }, [loading, user, profile?.csi_id, refreshProfile]);

  const caps = getCapabilities(profile);
  const isVerified = caps.isVerified;
  const canWriteTechWeekly = caps.canWriteTech;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const result = await verifyCsiIdentityAction({
        csiId: csiIdInput,
        prn: prnInput,
      });

      if (!result.success) {
        setErrorMessage(
          result.error ||
            "Verification failed. Check your CSI ID and PRN, or ask the Technical Secretary if your PRN is missing or shared.",
        );
        return;
      }

      await refreshProfile();
      toast.success(`Verified CSI ID #${result.csiId}.`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || syncing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
          <p className="font-mono text-xs uppercase tracking-wider">
            Checking CSI roster…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:py-16">
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <ShieldCheck className="mx-auto h-8 w-8 text-foreground" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Sign in to verify your CSI ID
          </h1>
          <p className="text-sm text-muted-foreground">
            Use Google first, then link your CSI Member ID and university PRN.
            Anyone on the CSI roster can join Tech Weekly after verifying.
          </p>
          <div className="pt-2">
            <Button asChild className="rounded-md">
              <Link href="/auth/signin">Continue to Google Sign In</Link>
            </Button>
          </div>
        </div>
        <TechWeeklyGuide />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:py-16">
      {isVerified ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-3.5">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified CSI Identity
            </span>
            {profile?.csi_id && (
              <span className="font-mono text-xs text-foreground">
                CSI #{profile.csi_id}
              </span>
            )}
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {profile?.full_name || profile?.username}
              </h1>
              <p className="text-xs text-muted-foreground">
                Linked to the official CSI MIT-WPU roster. You can submit Tech
                Weekly dispatches when the window is open.
              </p>
            </div>

            <dl className="divide-y divide-border border-y border-border text-xs font-mono">
              <div className="flex justify-between py-3">
                <dt className="uppercase text-muted-foreground">Assigned role</dt>
                <dd className="font-medium text-foreground">
                  {formatRoleLabel(profile?.role)}
                </dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="uppercase text-muted-foreground">Department</dt>
                <dd className="text-foreground">{profile?.dept || "CSI"}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="uppercase text-muted-foreground">
                  Academic year
                </dt>
                <dd className="text-foreground">
                  {profile?.year || "CSI MIT-WPU"}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="rounded-md text-xs">
                <Link href="/tech-weekly">
                  Open CSI Tech Weekly
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              {canWriteTechWeekly && (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-md bg-card text-xs"
                >
                  <Link href="/tech-weekly/write">
                    <PenTool className="mr-1.5 h-3.5 w-3.5" />
                    Write weekly dispatch
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-3.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
              Join CSI Tech Weekly
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              One-time verify
            </span>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Verify your CSI ID
              </h1>
              <ol className="list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-muted-foreground">
                <li>You are signed in with Google.</li>
                <li>Enter your CSI Member ID and 10-digit university PRN.</li>
                <li>
                  Once verified, you can write Tech Weekly, comment, and react —
                  any CSI department.
                </li>
                <li>
                  If verification fails, your PRN may be missing or shared. Ask
                  the Technical Secretary (CSI #303) to link you from Admin.
                </li>
              </ol>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="csi-id"
                  className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                >
                  CSI Member ID
                </Label>
                <Input
                  id="csi-id"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 241 or 332(D)"
                  value={csiIdInput}
                  onChange={(e) => setCsiIdInput(e.target.value)}
                  required
                  className="h-10 rounded-md font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="prn"
                  className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                >
                  University PRN (10 digits)
                </Label>
                <Input
                  id="prn"
                  type="password"
                  inputMode="numeric"
                  placeholder="Your MIT-WPU PRN"
                  value={prnInput}
                  onChange={(e) => setPrnInput(e.target.value)}
                  required
                  className="h-10 rounded-md font-mono text-sm"
                />
              </div>

              {errorMessage && (
                <Alert variant="destructive" className="rounded-md py-3">
                  <AlertDescription className="text-xs">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="h-10 w-full rounded-md text-xs font-medium"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify and unlock Tech Weekly"
                )}
              </Button>
            </form>

            <div className="flex items-start gap-2.5 border-t border-border pt-4 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
              <span>
                Once claimed, a CSI ID stays bound to this Google account. Only
                the Technical Secretary can reassign it.
              </span>
            </div>
          </div>
        </div>
      )}

      <TechWeeklyGuide />
    </div>
  );
}
