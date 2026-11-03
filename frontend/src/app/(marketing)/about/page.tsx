import Image from "next/image";
import Link from "next/link";
import { Globe, ArrowUpRight } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/BrandIcons";
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
        <div className="grid items-start gap-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <p className="type-label text-muted-foreground">
              01 · Editorial mandate
            </p>
            <h2 className="type-display text-[clamp(1.6rem,4vw,2.4rem)]">
              Built for rigorous technical writing and long-form clarity.
            </h2>
            <p className="type-body text-sm sm:text-base">
              The Fourth Clover was created to provide a distraction-free
              publishing environment where engineering architecture notes,
              systems breakdowns, and technical monographs are treated with
              print-grade typography.
            </p>
            <p className="type-body text-sm sm:text-base">
              Every week, verified members of the Computer Society of India
              (MIT-WPU Student Chapter) — across every department — submit
              essays from Friday 09:00 IST through Wednesday morning. Our
              Technical Heads review the cohort and curate one standout dispatch
              for the official CSI LinkedIn feed.
            </p>
          </div>

          <div className="panel flex flex-col justify-between gap-8 p-0 lg:col-span-5">
            <div className="panel-header">
              <div className="flex h-10 w-10 items-center justify-center border border-[var(--fg-line)] text-[var(--brand-color)]">
                <CloverMark className="h-5 w-5" />
              </div>
              <span className="type-label text-muted-foreground">
                CSI MIT-WPU
              </span>
            </div>

            <div className="space-y-3 px-6 pb-6">
              <p className="type-label text-muted-foreground">
                Publication protocol
              </p>
              <dl className="divide-y divide-[var(--fg-line)] border-y border-[var(--fg-line)] text-sm">
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">Submission window</dt>
                  <dd className="type-label text-foreground">
                    Friday 09:00 IST
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">Weekly selection</dt>
                  <dd className="type-label text-foreground">
                    1 LinkedIn dispatch
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">Verification</dt>
                  <dd className="type-label text-foreground">
                    CSI ID + PRN
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div id="masthead" className="border-t border-[var(--fg-line)] pt-12">
          <div className="mb-8">
            <p className="type-label mb-2 text-muted-foreground">
              02 · Masthead
            </p>
            <h2 className="type-display text-[clamp(1.5rem,3.5vw,2.25rem)]">
              Publisher & Technical Secretary
            </h2>
          </div>

          <div className="panel grid items-start gap-8 p-6 sm:p-8 md:grid-cols-12">
            <div className="flex justify-center md:col-span-3 md:justify-start">
              <div className="relative h-36 w-36 overflow-hidden border border-[var(--fg-line)] bg-muted sm:h-44 sm:w-44">
                <Image
                  src="/images/aryan-dani.jpg"
                  alt="Aryan Dani"
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-4 md:col-span-9">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--fg-line)] pb-3">
                <div>
                  <h3 className="type-person text-2xl text-foreground">
                    Aryan Dani
                  </h3>
                  <p className="type-label mt-1 text-[var(--brand-color)]">
                    Technical Secretary · CSI MIT-WPU
                  </p>
                </div>
                <span className="type-label text-muted-foreground">
                  CSI #303
                </span>
              </div>

              <p className="type-body text-sm sm:text-base">
                I built The Fourth Clover to explore the intersection of modern
                full-stack engineering and editorial publishing. Designed with
                Next.js App Router, TypeScript, and row-level secured Supabase
                Postgres, the platform powers both long-form essays and CSI
                MIT-WPU&apos;s weekly engineering publication.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Link
                  href="https://github.com/aryan-dani"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-editorial !px-3 !py-2 text-[0.65rem]"
                >
                  <GitHubIcon className="h-3.5 w-3.5" />
                  GitHub
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
                <Link
                  href="https://www.linkedin.com/in/aryandani/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-editorial !px-3 !py-2 text-[0.65rem]"
                >
                  <LinkedInIcon className="h-3.5 w-3.5" />
                  LinkedIn
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
                <Link
                  href="https://www.aryandani.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-editorial !px-3 !py-2 text-[0.65rem]"
                >
                  <Globe className="h-3.5 w-3.5" />
                  aryandani.com
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
