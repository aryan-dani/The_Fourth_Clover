"use client";

import Link from "next/link";
import { motionEase } from "@/lib/motion";
import { motion } from "framer-motion";

type AuthShellProps = {
  children: React.ReactNode;
  /** Shown on desktop left panel */
  quote?: string;
};

export function AuthShell({
  children,
  quote = "Writing is thinking on paper. Here, ideas find soil and light.",
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,28rem)]">
      <aside className="relative hidden flex-col justify-between border-b border-border/50 bg-muted/30 px-10 py-10 lg:flex xl:px-14 xl:py-12">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <span className="text-xl leading-none" aria-hidden>
              🍀
            </span>
            <span className="font-display font-semibold tracking-tight">
              The Fourth Clover
            </span>
          </Link>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: motionEase, delay: 0.1 }}
            className="mt-10 max-w-md font-serif text-xl leading-relaxed text-muted-foreground md:text-2xl xl:mt-12"
          >
            {quote}
          </motion.p>
        </div>
        <p className="font-sans text-xs text-muted-foreground/90">
          Minimal blogging · clear by design
        </p>
      </aside>

      <div className="relative flex min-h-screen flex-col justify-center bg-background lg:min-h-0">
        <div className="border-b border-border/50 bg-card/70 px-4 py-3 backdrop-blur-sm lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-xl leading-none" aria-hidden>
              🍀
            </span>
            <span className="font-display text-base font-semibold tracking-tight">
              The Fourth Clover
            </span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
