"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GoogleSignIn from "@/features/auth/components/GoogleSignIn";
import { AuthShell } from "@/components/layout/AuthShell";
import { CloverMark } from "@/components/layout/CloverMark";

export default function SignInPage() {
  return (
    <AuthShell>
      <div className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Masthead
          </Link>

          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
            <div className="border-b border-border bg-muted/40 px-6 py-3 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                Institutional Access
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                CSI MIT-WPU
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground">
                  <CloverMark className="h-5 w-5" />
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  Sign in to The Fourth Clover
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Authenticate with Google. Verified members of the CSI MIT-WPU
                  Technical Wing can file weekly engineering dispatches.
                </p>
              </div>

              <GoogleSignIn />

              <div className="border-t border-border pt-5 space-y-2.5 text-xs text-muted-foreground">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground">
                  Verification Protocol
                </p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>Authenticate with your Google account.</li>
                  <li>
                    Link your CSI Roster ID and 10-digit University PRN (one-time
                    two-factor claim).
                  </li>
                  <li>
                    Publish anytime while open · cycles start Friday 09:00 IST
                    IST.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
    </AuthShell>
  );
}
