"use client";

import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import { motionEase } from "@/lib/motion";

export function Footer() {
  return (
    <motion.footer
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: motionEase }}
      className="mt-auto border-t border-border/60 bg-muted/25 backdrop-blur-sm"
    >
      <div className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none" aria-hidden>
                🍀
              </span>
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                The Fourth Clover
              </span>
            </div>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              A calm place to write, read, and grow. Built for clarity and connection.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-12">
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">
                Product
              </p>
              <nav className="mt-3 flex flex-col gap-2 font-sans text-sm text-muted-foreground">
                <Link href="/explore" className="hover:text-foreground transition-colors">
                  Explore
                </Link>
                <Link href="/write" className="hover:text-foreground transition-colors">
                  Write
                </Link>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </nav>
            </div>
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">
                Legal
              </p>
              <nav className="mt-3 flex flex-col gap-2 font-sans text-sm text-muted-foreground">
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link href="/copyright" className="hover:text-foreground transition-colors">
                  Copyright
                </Link>
              </nav>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">
                Connect
              </p>
              <div className="mt-3 flex gap-2">
                <motion.a
                  href="https://github.com/aryan-dani/The-Fourth-Clover"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Github className="h-4 w-4" />
                </motion.a>
                <motion.a
                  href="https://twitter.com/thefourthclover"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Twitter className="h-4 w-4" />
                </motion.a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-4 font-sans text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} The Fourth Clover. All rights reserved.</p>
          <p className="hidden sm:block text-center">Crafted with care for readers and writers.</p>
        </div>
      </div>
    </motion.footer>
  );
}
