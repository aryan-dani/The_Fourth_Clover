"use client";

import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { motionEase } from "@/lib/motion";

export function Footer() {
  return (
    <LazyMotion features={domAnimation}>
      <m.footer
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: motionEase }}
        className="border-border/60 bg-muted/25 mt-auto border-t backdrop-blur-sm"
      >
        <div className="max-w-content mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none" aria-hidden>
                  🍀
                </span>
                <span className="font-display text-foreground text-lg font-semibold tracking-tight">
                  The Fourth Clover
                </span>
              </div>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                A calm place to write, read, and grow. Built for clarity and
                connection.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-12">
              <div>
                <p className="text-primary font-sans text-xs font-semibold tracking-wider uppercase">
                  Product
                </p>
                <nav className="text-muted-foreground mt-3 flex flex-col gap-2 font-sans text-sm">
                  <Link
                    href="/explore"
                    className="hover:text-foreground transition-colors"
                  >
                    Explore
                  </Link>
                  <Link
                    href="/csi"
                    className="hover:text-foreground transition-colors"
                  >
                    CSI
                  </Link>
                  <Link
                    href="/write"
                    className="hover:text-foreground transition-colors"
                  >
                    Write
                  </Link>
                  <Link
                    href="/about"
                    className="hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                </nav>
              </div>
              <div>
                <p className="text-primary font-sans text-xs font-semibold tracking-wider uppercase">
                  Legal
                </p>
                <nav className="text-muted-foreground mt-3 flex flex-col gap-2 font-sans text-sm">
                  <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/copyright"
                    className="hover:text-foreground transition-colors"
                  >
                    Copyright
                  </Link>
                </nav>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-primary font-sans text-xs font-semibold tracking-wider uppercase">
                  Connect
                </p>
                <div className="mt-3 flex gap-2">
                  <m.a
                    href="https://github.com/aryan-dani/The-Fourth-Clover"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    className="border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-primary flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
                  >
                    <Github className="h-4 w-4" />
                  </m.a>
                  <m.a
                    href="https://www.linkedin.com/in/aryandani/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    className="border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-primary flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                  </m.a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-border/50 text-muted-foreground mt-8 flex flex-col items-center justify-between gap-3 border-t pt-4 font-sans text-xs sm:flex-row">
            <p>
              © {new Date().getFullYear()} The Fourth Clover. All rights
              reserved.
            </p>
            <p className="hidden text-center sm:block">
              Crafted with care for readers and writers.
            </p>
          </div>
        </div>
      </m.footer>
    </LazyMotion>
  );
}
