"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { getCapabilities } from "@/lib/roles";
import type { HomeData } from "@/features/data/home-queries";
import {
  DrawLine,
  Reveal,
  RevealText,
  ScriptWipe,
} from "@/components/motion/Reveal";
import { FeaturedTechWeeklyBanner } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";

function formatCountdown(targetIso: string | null | undefined) {
  if (!targetIso) return { expired: false, label: "—" };
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return { expired: true, label: "Cutoff passed" };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const mins = Math.floor((diff / 60000) % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    expired: false,
    label: `${pad(days)}d ${pad(hours)}h ${pad(mins)}m`,
  };
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function HomePageClient({ data }: { data: HomeData }) {
  const { profile, user } = useAuth();
  const caps = getCapabilities(profile);
  const [countdown, setCountdown] = useState({ expired: false, label: "—" });

  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(data.cutoffAt));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [data.cutoffAt]);

  const [dateline, setDateline] = useState("");

  useEffect(() => {
    setDateline(
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    );
  }, []);

  return (
    <div>
      {/* Hero — paper */}
      <section
        className="wrap min-h-[70vh] pb-16 pt-10 md:pb-24 md:pt-16"
      >
        <Reveal trigger="intro" delay={0.05} y={12}>
          <div className="type-label flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
            <span suppressHydrationWarning>{dateline || "\u00A0"}</span>
            <span className="hidden sm:inline">CSI MIT-WPU Technical Press</span>
            <Link href="/about" className="link-u">
              About the publication
            </Link>
          </div>
        </Reveal>

        <DrawLine trigger="intro" delay={0.15} className="hairline-rule my-8" />

        <h1 className="type-display mt-2 max-w-4xl text-[clamp(2.8rem,10vw,6.5rem)]">
          <RevealText as="span" by="words" trigger="intro" className="block">
            Writing, poetry
          </RevealText>
          <span className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <RevealText as="span" by="words" trigger="intro" delay={0.12}>
              &amp;
            </RevealText>
            <ScriptWipe
              as="span"
              trigger="intro"
              delay={0.35}
              className="type-script text-[0.55em] normal-case tracking-normal text-[var(--brand-color)]"
            >
              engineering
            </ScriptWipe>
          </span>
        </h1>

        <Reveal trigger="intro" delay={0.25} className="mt-8 max-w-xl">
          <p className="type-body text-lg">
            An editorial publication from CSI MIT-WPU — essays and verse in the
            Journal, systems thinking in Tech Weekly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/journal" className="btn-editorial">
              Read the Journal
            </Link>
            <Link href="/tech-weekly" className="btn-editorial">
              Tech Weekly
            </Link>
            <Link
              href={user && caps.canWriteJournal ? "/write" : "/auth/signin"}
              className="type-label link-u self-center px-2"
            >
              {user ? "Start writing" : "Sign in to write"}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Tech Weekly — clover wash */}
      <section className="border-y border-[var(--fg-line)] py-16 md:py-20">
        <div className="wrap">
          <Reveal y={20}>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="type-label text-muted-foreground">Tech Weekly</p>
                <h2 className="type-display mt-3 text-[clamp(1.8rem,5vw,3rem)]">
                  {data.weekTitle || "This week’s issue"}
                </h2>
                <p className="type-body mt-3 max-w-lg">
                  {countdown.expired
                    ? "Submission window closed — review in progress."
                    : `Submission window closes in ${countdown.label}`}
                </p>
              </div>
              <Link href="/tech-weekly" className="btn-editorial">
                Open issue
              </Link>
            </div>
          </Reveal>

          {data.featuredPick && (
            <Reveal y={24} className="mb-10">
              <FeaturedTechWeeklyBanner
                submission={data.featuredPick}
                canCopyLinkedIn={caps.canReview}
              />
            </Reveal>
          )}

          {data.latestTech.length > 0 && (
            <ul className="divide-y divide-[var(--fg-line)] border-t border-[var(--fg-line)]">
              {data.latestTech.map((sub, i) => (
                <Reveal key={sub.id} as="li" y={16} delay={i * 0.06}>
                  <Link
                    href={`/tech-weekly/${sub.slug}`}
                    className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                  >
                    <span className="type-display text-[clamp(1.1rem,2.5vw,1.55rem)] transition-opacity group-hover:opacity-70">
                      {sub.title}
                    </span>
                    <span className="type-label shrink-0 opacity-70">
                      {sub.author?.full_name ||
                        sub.author?.username ||
                        "Contributor"}
                      {sub.created_at ? ` · ${formatDate(sub.created_at)}` : ""}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Journal — paper */}
      <section className="wrap py-16 md:py-24">
        <Reveal y={18}>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="type-label text-muted-foreground">Journal</p>
              <h2 className="type-display mt-3 text-[clamp(1.8rem,5vw,3rem)]">
                From the Journal
              </h2>
            </div>
            <Link href="/journal" className="type-label link-u">
              View all →
            </Link>
          </div>
        </Reveal>

        <DrawLine className="hairline-rule mb-2" />

        <ul>
          {data.journalLead && (
            <Reveal as="li" y={18}>
              <Link
                href={`/post/${data.journalLead.slug}`}
                className="group block border-b border-[var(--fg-line)] py-8"
              >
                <p className="type-label text-muted-foreground">
                  Lead ·{" "}
                  {formatDate(
                    data.journalLead.published_at ||
                      data.journalLead.created_at,
                  )}
                </p>
                <h3 className="type-display mt-3 text-[clamp(1.6rem,4vw,2.75rem)] transition-opacity group-hover:opacity-70">
                  {data.journalLead.title}
                </h3>
                {data.journalLead.excerpt && (
                  <p className="type-body mt-3 max-w-2xl">
                    {data.journalLead.excerpt}
                  </p>
                )}
              </Link>
            </Reveal>
          )}
          {data.journalLatest.slice(0, 5).map((post, i) => (
            <Reveal key={post.id} as="li" y={14} delay={i * 0.05}>
              <Link
                href={`/post/${post.slug}`}
                className="group flex flex-col gap-2 border-b border-[var(--fg-line)] py-5 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span className="text-lg tracking-tight transition-opacity group-hover:opacity-70 md:text-xl">
                  {post.title}
                </span>
                <span className="type-label shrink-0 text-muted-foreground">
                  {post.author?.full_name || post.author?.username || "Author"}
                  {" · "}
                  {formatDate(post.published_at || post.created_at)}
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Closing — ink */}
      <section className="border-t border-[var(--fg-line)] py-20 md:py-28">
        <div className="wrap text-center">
          <Reveal y={20}>
            <p className="type-label text-muted-foreground">Stay close</p>
            <h2 className="type-display mx-auto mt-4 max-w-3xl text-[clamp(2rem,6vw,3.75rem)]">
              Follow the{" "}
              <span className="type-script text-[0.7em] normal-case tracking-normal">
                feeds
              </span>
            </h2>
            <p className="type-body mx-auto mt-5 max-w-md">
              Subscribe via RSS, or open Tech Weekly every Sunday for the next
              engineering cycle.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a href="/feed.xml" className="btn-editorial">
                Journal RSS
              </a>
              <Link href="/tech-weekly" className="btn-editorial">
                This week’s Tech Weekly
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
