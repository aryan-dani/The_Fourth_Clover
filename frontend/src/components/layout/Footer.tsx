"use client";

import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-24 md:pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="circle-logo h-8 w-8">
                <span className="text-base leading-none" role="img" aria-label="Clover">
                  🍀
                </span>
              </div>
              <span className="font-display text-base font-bold tracking-tight text-foreground">
                The Fourth Clover
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              The official engineering publication and weekly technical
              chronicle of the Computer Society of India, MIT World Peace
              University Chapter.
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              ISSN · CSI MIT-WPU TECHNICAL PRESS
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">
                Publication
              </p>
              <nav className="flex flex-col gap-2 text-xs text-muted-foreground">
                <Link
                  href="/tech-weekly"
                  className="transition-colors hover:text-foreground"
                >
                  CSI Tech Weekly
                </Link>
                <Link
                  href="/explore"
                  className="transition-colors hover:text-foreground"
                >
                  Open Archive
                </Link>
                <Link
                  href="/tech-weekly/write"
                  className="transition-colors hover:text-foreground"
                >
                  Submit Dispatch
                </Link>
                <Link
                  href="/about"
                  className="transition-colors hover:text-foreground"
                >
                  Masthead & About
                </Link>
              </nav>
            </div>

            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">
                Governance
              </p>
              <nav className="flex flex-col gap-2 text-xs text-muted-foreground">
                <Link
                  href="/verify-csi"
                  className="transition-colors hover:text-foreground"
                >
                  CSI Roster Verification
                </Link>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-foreground"
                >
                  Privacy Charter
                </Link>
                <Link
                  href="/copyright"
                  className="transition-colors hover:text-foreground"
                >
                  Copyright & Attribution
                </Link>
              </nav>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">
                Syndication
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/aryan-dani/The-Fourth-Clover"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Repository"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  <Github className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/aryandani/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p className="font-mono text-[11px]" suppressHydrationWarning>
            © {new Date().getFullYear()} The Fourth Clover · CSI MIT-WPU
          </p>
          <p className="font-mono text-[11px]">
            Curated by the Technical Wing · Sunday to Wednesday IST Cycle
          </p>
        </div>
      </div>
    </footer>
  );
}
