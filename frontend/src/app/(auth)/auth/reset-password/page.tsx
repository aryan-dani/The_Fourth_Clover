"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/layout/AuthShell";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const handlePasswordReset = async () => {
      const code = searchParams.get("code");

      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Code exchange error:", error);
            setError(error.message);
            setIsValidSession(false);
          } else if (data.session) {
            setIsValidSession(true);
          }
        } catch (err) {
          console.error("Error exchanging code:", err);
          setIsValidSession(false);
        }
        setCheckingSession(false);
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          setIsValidSession(true);
          setCheckingSession(false);
        }
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setCheckingSession(false);

      return () => {
        subscription.unsubscribe();
      };
    };

    handlePasswordReset();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      setSuccess(true);

      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/auth/signin");
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <AuthShell quote="Almost there — choose a strong password you’ll remember.">
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Verifying link…</p>
        </div>
      </AuthShell>
    );
  }

  if (!isValidSession) {
    return (
      <AuthShell quote="Links expire for your safety. Request a fresh one anytime.">
        <Card className="border-border/80 shadow-lg">
          <CardContent className="space-y-4 pt-8 pb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
              <Lock className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Invalid or expired link
            </h2>
            <p className="font-sans text-sm text-muted-foreground">
              This reset link is no longer valid. Request a new one from sign in.
            </p>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button asChild className="w-full">
              <Link href="/auth/forgot-password">Request new link</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell quote="Pick a password only you know — we’ll sign you out of other sessions.">
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/signin" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Card className="border-border/80 shadow-lg">
          <CardHeader className="space-y-2 pb-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">New password</CardTitle>
            <CardDescription className="font-sans text-base">
              Enter and confirm your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
            {success ? (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">Password updated</h3>
                <p className="font-sans text-sm text-muted-foreground">Redirecting to sign in…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !password || !confirmPassword}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
          </div>
        </AuthShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
