"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/auth-context";
import {
  verifyCsiIdentityAction,
  syncUserVerificationStatusAction,
} from "@/features/data/csi-verification-actions";
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

  const isVerified =
    Boolean(profile?.csi_id && profile?.role && profile.role !== "unverified") ||
    Boolean(profile?.is_admin);

  const canWriteTechWeekly =
    profile?.role === "tech_member" ||
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    Boolean(profile?.is_admin);

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
            "Verification failed. Please check your CSI ID and PRN, or contact the Technical Secretary."
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
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
          <p className="font-mono text-xs uppercase tracking-wider">
            Verifying CSI Roster Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <ShieldCheck className="mx-auto h-8 w-8 text-foreground" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Sign in to Verify Your CSI ID
          </h1>
          <p className="text-sm text-muted-foreground">
            Authenticate with Google first, then link your CSI Roster ID and
            University PRN.
          </p>
          <div className="pt-2">
            <Button asChild className="rounded-md">
              <Link href="/auth/signin">Continue to Google Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <LazyMotion features={domAnimation}>
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isVerified ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
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

              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-1">
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
                    {profile?.full_name || profile?.username}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Permanently linked to the official CSI MIT-WPU roster.
                  </p>
                </div>

                <dl className="divide-y divide-border border-y border-border text-xs font-mono">
                  <div className="py-3 flex justify-between">
                    <dt className="text-muted-foreground uppercase">
                      ASSIGNED ROLE
                    </dt>
                    <dd className="text-foreground font-medium">
                      {formatRoleLabel(profile?.role)}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-muted-foreground uppercase">
                      DEPARTMENT
                    </dt>
                    <dd className="text-foreground">
                      {profile?.dept || "Tech"}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-muted-foreground uppercase">
                      ACADEMIC YEAR
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
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                  {canWriteTechWeekly && (
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-md text-xs bg-card"
                    >
                      <Link href="/tech-weekly/write">
                        <PenTool className="h-3.5 w-3.5 mr-1.5" />
                        Write Weekly Dispatch
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-3.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                  Two-Factor Roster Verification
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  One-Time Claim
                </span>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                    Verify Your CSI ID
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Enter your official CSI MIT-WPU Member ID and 10-digit
                    University PRN to unlock your chapter role. Public reading
                    remains open to all visitors.
                  </p>
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
                      placeholder="e.g. 241"
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
                      University PRN (10 Digits)
                    </Label>
                    <Input
                      id="prn"
                      type="password"
                      inputMode="numeric"
                      placeholder="10-digit MIT-WPU PRN"
                      value={prnInput}
                      onChange={(e) => setPrnInput(e.target.value)}
                      required
                      className="h-10 rounded-md font-mono text-sm"
                    />
                    <p className="font-mono text-[10px] text-muted-foreground">
                      Verified via server-side HMAC-SHA256 hash. Never stored or
                      transmitted in plaintext.
                    </p>
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
                    className="w-full h-10 rounded-md text-xs font-medium"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying Roster Identity...
                      </>
                    ) : (
                      "Claim & Verify CSI Identity"
                    )}
                  </Button>
                </form>

                <div className="border-t border-border pt-4 flex items-start gap-2.5 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-foreground" />
                  <span>
                    Once claimed, a CSI ID is permanently bound to your Google
                    account and can only be reassigned by the Technical
                    Secretary (CSI #303).
                  </span>
                </div>
              </div>
            </div>
          )}
        </m.div>
      </LazyMotion>
    </div>
  );
}
