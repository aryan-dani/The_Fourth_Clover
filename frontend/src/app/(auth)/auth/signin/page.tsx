"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import GoogleSignIn from "@/features/auth/components/GoogleSignIn";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { AuthShell } from "@/components/layout/AuthShell";

export default function SignInPage() {
  return (
    <AuthShell>
      <LazyMotion features={domAnimation}>
        <m.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/"
              className="flex items-center text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-border/80 bg-card/85 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="space-y-4 pb-6 text-center">
              <div className="flex justify-center">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 ring-4 ring-emerald-500/5">
                  <span className="text-4xl leading-none" aria-hidden>
                    🍀
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <CardTitle className="font-display text-2xl sm:text-3xl tracking-tight">
                  Sign in to The Fourth Clover
                </CardTitle>
                <CardDescription className="font-sans text-sm leading-relaxed max-w-sm mx-auto">
                  Authenticate with Google. Verified CSI MIT-WPU Technical members can publish to CSI Tech Weekly.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-8">
              <GoogleSignIn />

              <div className="rounded-2xl border border-border/70 bg-muted/35 p-4 space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Step 1:</strong> Sign in with your Google account.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Terminal className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Step 2:</strong> Enter your CSI ID and University PRN once to link your verified CSI role.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Step 3:</strong> Submit weekly articles (Sunday to Wednesday 09:00 IST) and collaborate with peers.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>
      </LazyMotion>
    </AuthShell>
  );
}
