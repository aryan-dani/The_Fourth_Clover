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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] lg:grid lg:grid-cols-12">
      <aside
        className="hidden flex-col justify-between border-r border-[var(--fg-line)] p-12 lg:col-span-6 lg:flex xl:col-span-7 xl:p-16"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        <div className="space-y-12">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <CloverMark size="md" className="text-[var(--paper)]" />
            <span className="type-display text-[0.95rem]">
              The Fourth{" "}
              <span className="type-script text-[1.35em] normal-case tracking-normal">
                Clover
              </span>
            </span>
          </Link>

          <div className="max-w-lg space-y-4">
            <p className="type-label opacity-70">
              CSI MIT-WPU · Technical Press
            </p>
            <blockquote className="type-display text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.05]">
              &ldquo;{quote}&rdquo;
            </blockquote>
          </div>
        </div>

        <div className="type-label flex items-center justify-between border-t border-[var(--fg-line)] pt-6 opacity-70">
          <span>VOL. IV · PUNE, IN</span>
          <span>SUNDAY TO WEDNESDAY IST</span>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col justify-center lg:col-span-6 xl:col-span-5">
        <div className="border-b border-[var(--fg-line)] px-4 py-3.5 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <CloverMark size="sm" className="text-[var(--brand-color)]" />
            <span className="type-display text-sm">
              The Fourth{" "}
              <span className="type-script text-[1.35em] normal-case tracking-normal text-[var(--brand-color)]">
                Clover
              </span>
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
