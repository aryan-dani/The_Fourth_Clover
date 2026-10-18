"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { FeaturedTechWeeklyBanner } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import type { TechSubmissionWithAuthor } from "@/types/database";

export function HomeHeroClient({
  featuredPick,
}: {
  featuredPick: TechSubmissionWithAuthor | null;
}) {
  const { user, profile } = useAuth();

  const isTechMember =
    profile?.role === "tech_member" ||
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    Boolean(profile?.is_admin);

  const canCopyLinkedIn =
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    profile?.csi_id === 241 ||
    profile?.csi_id === 246 ||
    profile?.csi_id === 303 ||
    Boolean(profile?.is_admin);

  const primaryWriteHref = !user
    ? "/auth/signin"
    : isTechMember
      ? "/tech-weekly/write"
      : "/verify-csi";

  return (
    <LazyMotion features={domAnimation}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top Dateline Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          <span>VOL. IV · CSI MIT-WPU ENGINEERING PRESS</span>
          <span className="hidden sm:inline">
            WEEKLY CYCLE: SUNDAY 00:00 TO WEDNESDAY 09:00 IST
          </span>
          <Link
            href="/tech-weekly"
            className="inline-flex items-center gap-1 text-foreground hover:underline"
          >
            CURRENT ISSUE
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Main Editorial Broadsheet Grid */}
        <div className="grid border-b border-border lg:grid-cols-12">
          {/* Left Column: Manifesto & Primary Actions */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="py-12 sm:py-16 lg:col-span-7 lg:border-r lg:border-border lg:pr-12 space-y-8"
          >
            <div className="space-y-4">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Technical Monograph & Weekly Chronicle
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight text-foreground leading-[1.08]">
                Where engineering thought meets permanent ink.
              </h1>
            </div>

            <p className="max-w-xl font-serif text-lg sm:text-xl leading-relaxed text-muted-foreground">
              Each week, verified engineers of the CSI MIT-WPU Technical Wing
              publish architectural deep-dives, systems postmortems, and
              implementation guides. Every Wednesday morning, one dispatch is
              selected as the chapter&apos;s official LinkedIn feature.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="h-11 rounded-md px-6 text-sm font-medium"
              >
                <Link href="/tech-weekly">
                  Read CSI Tech Weekly
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-md px-6 text-sm font-medium bg-card"
              >
                <Link href={primaryWriteHref}>
                  {user
                    ? isTechMember
                      ? "Write Weekly Dispatch"
                      : "Verify CSI Identity"
                    : "Sign in to Contribute"}
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-11 rounded-md px-4 text-sm text-muted-foreground hover:text-foreground"
              >
                <Link href="/explore">Browse Open Archive</Link>
              </Button>
            </div>
          </m.div>

          {/* Right Column: Editorial Specifications Ledger */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="flex flex-col justify-between border-t border-border py-10 lg:col-span-5 lg:border-t-0 lg:pl-10 lg:py-16 space-y-8"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                  Publication Protocol
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  IST (UTC+05:30)
                </span>
              </div>

              <dl className="divide-y divide-border/80 text-xs">
                <div className="py-3.5 flex items-baseline justify-between gap-4">
                  <dt className="font-mono uppercase tracking-wider text-muted-foreground">
                    Submission Window
                  </dt>
                  <dd className="font-mono text-right text-foreground">
                    Sun 00:00 to Wed 09:00 IST
                  </dd>
                </div>
                <div className="py-3.5 flex items-baseline justify-between gap-4">
                  <dt className="font-mono uppercase tracking-wider text-muted-foreground">
                    Editorial Curation
                  </dt>
                  <dd className="font-mono text-right text-foreground">
                    Wed Morning · 1 Pick / Week
                  </dd>
                </div>
                <div className="py-3.5 flex items-baseline justify-between gap-4">
                  <dt className="font-mono uppercase tracking-wider text-muted-foreground">
                    Author Eligibility
                  </dt>
                  <dd className="font-mono text-right text-foreground">
                    Verified CSI Technical Wing
                  </dd>
                </div>
                <div className="py-3.5 flex items-baseline justify-between gap-4">
                  <dt className="font-mono uppercase tracking-wider text-muted-foreground">
                    Target Length
                  </dt>
                  <dd className="font-mono text-right text-foreground">
                    150–300 Words (2,000 Cap)
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-md border border-border bg-card p-5 space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">
                Editorial Board
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Curated by Technical Heads Darshan Nayak (CSI #241) and Tanish
                Bhavsar (CSI #246), overseen by Technical Secretary Aryan Dani
                (CSI #303).
              </p>
            </div>
          </m.div>
        </div>

        {/* Featured Weekly Pick Spread (if available) */}
        {featuredPick && (
          <div className="py-12 border-b border-border">
            <FeaturedTechWeeklyBanner
              submission={featuredPick}
              canCopyLinkedIn={canCopyLinkedIn}
            />
          </div>
        )}

        {/* Three-Column Architectural Cadence */}
        <section className="grid divide-y divide-border border-b border-border md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="py-10 md:pr-8 space-y-3">
            <span className="font-mono text-xs text-muted-foreground">
              01 / DISPATCH
            </span>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Sunday to Wednesday Window
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Verified Technical Wing members draft and submit concise technical
              articles, complete with syntax-highlighted code and architectural
              diagrams, before Wednesday at 09:00 IST.
            </p>
          </div>

          <div className="py-10 md:px-8 space-y-3">
            <span className="font-mono text-xs text-muted-foreground">
              02 / DISCOURSE
            </span>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Peer Review & Discussion
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Throughout the week, fellow engineers endorse, critique, and
              discuss submissions in threaded technical commentary while
              building their chapter contribution record.
            </p>
          </div>

          <div className="py-10 md:pl-8 space-y-3">
            <span className="font-mono text-xs text-muted-foreground">
              03 / SYNDICATION
            </span>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Wednesday LinkedIn Selection
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Every Wednesday morning, the Technical Heads select one standout
              dispatch to be published on the official CSI MIT-WPU LinkedIn page
              with full author attribution.
            </p>
          </div>
        </section>
      </div>
    </LazyMotion>
  );
}
