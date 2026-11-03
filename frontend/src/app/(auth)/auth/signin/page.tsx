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
          className="type-label inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return home
        </Link>

        <div className="panel overflow-hidden">
          <div className="panel-header">
            <span className="type-label text-foreground">Sign in</span>
            <span className="type-label text-muted-foreground">CSI MIT-WPU</span>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center border border-[var(--fg-line)] text-[var(--brand-color)]">
                <CloverMark className="h-5 w-5" />
              </div>
              <h1 className="type-display text-[clamp(1.6rem,4vw,2.25rem)] text-foreground">
                The Fourth Clover
              </h1>
              <p className="type-body text-sm">
                Sign in with Google. Verified CSI members from every department
                can write Journal pieces and Tech Weekly dispatches.
              </p>
            </div>

            <GoogleSignIn />

            <div className="space-y-2.5 border-t border-[var(--fg-line)] pt-5">
              <p className="type-label text-foreground">After you sign in</p>
              <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
                <li>Verify with your CSI ID and university PRN.</li>
                <li>Write Journal anytime.</li>
                <li>
                  Submit Tech Weekly while the window is open (Friday 09:00 IST
                  through Wednesday).
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
