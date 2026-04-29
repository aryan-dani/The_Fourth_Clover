"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/layout/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell quote="A fresh start is still your story — we'll get you back in.">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/auth/signin"
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Card className="border-border/80 shadow-lg">
          <CardHeader className="space-y-3 pb-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Reset your password</CardTitle>
            <CardDescription className="font-sans text-base">
              Enter your email and we&apos;ll send a secure reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Check your email
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  We&apos;ve sent a link to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="font-sans text-xs text-muted-foreground">
                  Nothing there? Check spam, or{" "}
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className="font-medium text-primary hover:underline"
                  >
                    try again
                  </button>
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !email}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            )}

            <p className="text-center font-sans text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </AuthShell>
  );
}
