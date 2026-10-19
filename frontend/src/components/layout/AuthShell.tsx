"use client";

import Link from "next/link";
import { CloverMark } from "@/components/layout/CloverMark";

type AuthShellProps = {
  children: React.ReactNode;
  quote?: string;
};

export function AuthShell({
  children,
  quote = "Clarity in engineering begins with clarity in writing. Every system design decision deserves a permanent record.",
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-12">
        <aside className="hidden lg:col-span-6 xl:col-span-7 lg:flex flex-col justify-between border-r border-border bg-card p-12 xl:p-16">
          <div className="space-y-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-foreground"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground">
                <CloverMark className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                The Fourth Clover
              </span>
            </Link>

            <div className="space-y-4 max-w-lg">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                CSI MIT-WPU · Technical Press
              </p>
              <blockquote className="font-display text-2xl xl:text-3xl font-semibold tracking-tight text-foreground leading-snug">
                &ldquo;{quote}&rdquo;
              </blockquote>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>VOL. IV · PUNE, IN</span>
            <span>SUNDAY TO WEDNESDAY IST</span>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col justify-center lg:col-span-6 xl:col-span-5">
          <div className="border-b border-border bg-card px-4 py-3.5 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground">
                <CloverMark className="h-3.5 w-3.5" />
              </span>
              <span className="font-display text-base font-semibold tracking-tight">
                The Fourth Clover
              </span>
            </Link>
          </div>
          <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
            <div className="mx-auto w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
  );
}
