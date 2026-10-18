"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/features/auth/auth-context";
import {
  verifyCsiIdentityAction,
  syncUserVerificationStatusAction,
} from "@/features/data/csi-verification-actions";
import {
  ShieldCheck,
  KeyRound,
  Hash,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Lock,
  Sparkles,
  BookOpen,
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
      toast.success(`Verified CSI ID #${result.csiId}!`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || syncing) {
    return (
      <PageShell className="max-w-xl py-16">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          <p className="text-sm">Checking CSI verification status...</p>
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell className="max-w-xl py-12">
        <Card className="rounded-3xl border-border/80 bg-card/85 backdrop-blur-xl shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-fit rounded-2xl bg-emerald-500/10 p-3 border border-emerald-500/25">
              <ShieldCheck className="h-7 w-7 text-emerald-500" />
            </div>
            <CardTitle className="font-display text-2xl">
              Sign in to verify your CSI ID
            </CardTitle>
            <CardDescription>
              Use Google sign-in first, then link your CSI ID and university PRN.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/auth/signin">Continue to Google Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-xl py-8 sm:py-12">
      <LazyMotion features={domAnimation}>
        <m.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {isVerified ? (
            <Card className="rounded-3xl border-emerald-500/35 bg-card/90 backdrop-blur-xl shadow-xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 px-3 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Verified CSI Identity
                  </Badge>
                  {profile?.csi_id && (
                    <Badge variant="outline" className="font-mono text-xs">
                      CSI ID #{profile.csi_id}
                    </Badge>
                  )}
                </div>
                <CardTitle className="font-display text-2xl sm:text-3xl">
                  {profile?.full_name || profile?.username}
                </CardTitle>
                <CardDescription className="text-sm">
                  Your account is permanently linked to the official CSI MIT-WPU roster.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-border/70 bg-muted/35 p-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Role</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatRoleLabel(profile?.role)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {profile?.dept || "Tech"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Academic Year</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {profile?.year || "CSI MIT-WPU"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    asChild
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Link href="/tech-weekly">
                      Explore CSI Tech Weekly
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </Button>
                  {canWriteTechWeekly && (
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href="/tech-weekly/write">
                        <Sparkles className="h-4 w-4 mr-1.5 text-emerald-500" />
                        Write This Week&apos;s Post
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border-border/80 bg-card/90 backdrop-blur-xl shadow-xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                    Two-Factor Roster Check
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    One-time claim
                  </Badge>
                </div>
                <CardTitle className="font-display text-2xl sm:text-3xl tracking-tight">
                  Verify your CSI ID
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Enter your official CSI MIT-WPU Member ID and University PRN to unlock your role. Public reading remains open to everyone.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {errorMessage && (
                  <Alert variant="destructive" className="rounded-2xl">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csi-id">CSI Member ID</Label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="csi-id"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={999999}
                        placeholder="e.g. 241"
                        value={csiIdInput}
                        onChange={(e) => setCsiIdInput(e.target.value)}
                        required
                        className="pl-10 rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prn">University PRN (Second Factor)</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="prn"
                        type="password"
                        autoComplete="off"
                        placeholder="Enter your university PRN"
                        value={prnInput}
                        onChange={(e) => setPrnInput(e.target.value)}
                        required
                        className="pl-10 rounded-xl h-11 font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      Your PRN is verified via HMAC-SHA256 on the server and is never stored or returned in plaintext.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying against CSI roster...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Verify &amp; Claim CSI Identity
                      </>
                    )}
                  </Button>
                </form>

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Important security notes:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      Each CSI ID can only be claimed by one account. Once claimed, it cannot be changed without Super Admin approval.
                    </li>
                    <li>
                      Verification is rate-limited to 5 attempts per hour per user and IP.
                    </li>
                    <li>
                      If your PRN was blank or duplicated on the roster, ask Aryan Dani (Technical Secretary) to link your account from the Admin panel.
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <span>Not a CSI member? You still have full public reading access.</span>
                  <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                    <Link href="/tech-weekly">
                      <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                      Read Tech Weekly
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </m.div>
      </LazyMotion>
    </PageShell>
  );
}
