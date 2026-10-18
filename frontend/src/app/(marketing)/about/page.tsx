import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Globe, ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { CloverMark } from "@/components/layout/CloverMark";

export default function AboutPage() {
  return (
    <PageShell
      variant="wide"
      title="About The Fourth Clover"
      description="An independent technical publication and editorial platform built for CSI MIT-WPU engineers and thoughtful writers."
    >
      <div className="space-y-14">
        {/* Mission Spread */}
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              01 · Editorial Mandate
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Built for rigorous technical writing and long-form clarity.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              The Fourth Clover was created to provide a distraction-free
              publishing environment where engineering architecture notes,
              systems breakdowns, and technical monographs are treated with
              print-grade typography.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every week, verified members of the Computer Society of India
              (MIT-WPU Student Chapter) Technical Department submit essays from
              Sunday through Wednesday morning. Our Technical Heads review the
              cohort and curate one standout dispatch for the official CSI
              LinkedIn feed.
            </p>
          </div>

          <div className="lg:col-span-5 rounded-lg border border-border bg-card p-8 flex flex-col justify-between gap-8">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background text-primary">
                <CloverMark className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                ISSN · CSI MIT-WPU
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Publication Protocol
              </p>
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">Submission Window</dt>
                  <dd className="font-mono font-medium text-foreground">
                    Sun 00:00 to Wed 09:00 IST
                  </dd>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">Weekly Selection</dt>
                  <dd className="font-mono font-medium text-foreground">
                    1 Featured LinkedIn Dispatch
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Identity Verification</dt>
                  <dd className="font-mono font-medium text-foreground">
                    CSI ID + HMAC PRN 2FA
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Creator Section */}
        <div className="border-t border-border pt-12">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-1.5">
              02 · Masthead & Architecture
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Publisher & Technical Secretary
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-12 items-start rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="md:col-span-3 flex justify-center md:justify-start">
              <div className="w-36 h-36 sm:w-44 sm:h-44 bg-muted rounded-md overflow-hidden border border-border relative">
                <Image
                  src="/images/aryan-dani.jpg"
                  alt="Aryan Dani"
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="md:col-span-9 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    Aryan Dani
                  </h3>
                  <p className="text-xs font-mono uppercase tracking-[0.14em] text-primary mt-0.5">
                    Technical Secretary · CSI MIT-WPU · Creator of The Fourth Clover
                  </p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  CSI #303
                </span>
              </div>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                I built The Fourth Clover to explore the intersection of modern
                full-stack engineering and editorial publishing. Designed with
                Next.js App Router, TypeScript, and row-level secured Supabase
                Postgres, the platform powers both long-form essays and CSI
                MIT-WPU&apos;s weekly engineering publication.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href="https://github.com/aryan-dani"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-1.5 h-3.5 w-3.5" />
                    GitHub
                    <ArrowUpRight className="ml-1 h-3 w-3 text-muted-foreground" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href="https://www.linkedin.com/in/aryandani/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="mr-1.5 h-3.5 w-3.5" />
                    LinkedIn
                    <ArrowUpRight className="ml-1 h-3 w-3 text-muted-foreground" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href="https://www.aryandani.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="mr-1.5 h-3.5 w-3.5" />
                    aryandani.com
                    <ArrowUpRight className="ml-1 h-3 w-3 text-muted-foreground" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
