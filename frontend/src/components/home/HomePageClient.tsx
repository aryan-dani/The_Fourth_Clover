"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleCard, SectionLabel, PageHeader } from "@/components/editorial";
import { FeaturedTechWeeklyBanner } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import { useAuth } from "@/features/auth/auth-context";
import { getCapabilities } from "@/lib/roles";
import type { HomeData } from "@/features/data/home-queries";
import { useEffect, useState } from "react";

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

  const dateline = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
      {/* Masthead */}
      <div className="border-b border-hairline py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span suppressHydrationWarning>{dateline}</span>
          <span className="hidden sm:inline">CSI MIT-WPU Technical Press</span>
          <Link href="/about" className="hover:text-foreground">
            About the publication
          </Link>
        </div>
      </div>

      <header className="border-b border-hairline py-12 sm:py-16">
        <p className="meta-label mb-3">The Fourth Clover</p>
        <h1 className="font-display text-display-lg sm:text-display-xl max-w-3xl text-foreground">
          Writing, poetry &amp; engineering
        </h1>
        <p className="mt-4 max-w-2xl font-serif text-lg text-muted-foreground leading-relaxed">
          An editorial publication from CSI MIT-WPU — essays and verse in the
          Journal, systems thinking in Tech Weekly.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-md">
            <Link href="/journal">
              Read the Journal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-md">
            <Link href="/tech-weekly">CSI Tech Weekly</Link>
          </Button>
          {user ? (
            <Button asChild variant="ghost" className="rounded-md">
              <Link href={caps.canWriteJournal ? "/write" : "/auth/signin"}>
                Start writing
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" className="rounded-md">
              <Link href="/auth/signin">Sign in to write</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Tech Weekly band */}
      <section className="border-b border-hairline py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <PageHeader
            label="Tech Weekly"
            title={data.weekTitle || "This week’s issue"}
            description={
              countdown.expired
                ? "Submission window closed — review in progress."
                : `Submission window closes in ${countdown.label}`
            }
          />
          <Button asChild variant="outline" size="sm" className="rounded-md">
            <Link href="/tech-weekly">Open issue</Link>
          </Button>
        </div>

        {data.featuredPick && (
          <div className="mb-8">
            <FeaturedTechWeeklyBanner
              submission={data.featuredPick}
              canCopyLinkedIn={caps.canReview}
            />
          </div>
        )}

        {data.latestTech.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-3">
            {data.latestTech.map((sub) => (
              <ArticleCard
                key={sub.id}
                section="tech"
                variant="compact"
                title={sub.title}
                slug={sub.slug}
                excerpt={sub.summary}
                coverImage={sub.cover_image}
                author={sub.author}
                publishedAt={sub.created_at}
                readTime={sub.read_time}
                tags={sub.tags}
                reactionCount={sub.reaction_counts?.total}
                commentCount={sub.comment_count}
              />
            ))}
          </div>
        )}
      </section>

      {/* Journal */}
      <section className="border-b border-hairline py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>Journal</SectionLabel>
            <h2 className="mt-2 font-display text-display-md text-foreground">
              From the Journal
            </h2>
          </div>
          <Link
            href="/journal"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {data.journalLead && (
            <div className="lg:col-span-7">
              <ArticleCard
                section="journal"
                variant="lead"
                title={data.journalLead.title}
                slug={data.journalLead.slug}
                excerpt={data.journalLead.excerpt}
                coverImage={
                  data.journalLead.cover_image ||
                  data.journalLead.featured_image
                }
                author={data.journalLead.author}
                publishedAt={
                  data.journalLead.published_at || data.journalLead.created_at
                }
                readTime={data.journalLead.read_time}
                tags={data.journalLead.tags}
                format={
                  (data.journalLead as { format?: "prose" | "poetry" }).format
                }
                reactionCount={data.journalLead.likes?.[0]?.count}
                commentCount={data.journalLead.comments?.[0]?.count}
              />
            </div>
          )}
          <div className="space-y-6 lg:col-span-5">
            {data.journalLatest.slice(0, 4).map((post) => (
              <ArticleCard
                key={post.id}
                section="journal"
                variant="list"
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                author={post.author}
                publishedAt={post.published_at || post.created_at}
                readTime={post.read_time}
                format={(post as { format?: "prose" | "poetry" }).format}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Poetry strip */}
      {data.poetry.length > 0 && (
        <section className="border-b border-hairline py-12">
          <SectionLabel className="mb-4">Poetry</SectionLabel>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.poetry.map((post) => (
              <ArticleCard
                key={post.id}
                section="journal"
                variant="compact"
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                author={post.author}
                publishedAt={post.published_at || post.created_at}
                format="poetry"
              />
            ))}
          </div>
        </section>
      )}

      {/* Subscribe */}
      <section className="py-14 text-center">
        <p className="meta-label mb-3">Stay close</p>
        <h2 className="font-display text-display-sm text-foreground">
          Follow the feeds
        </h2>
        <p className="mx-auto mt-3 max-w-md font-serif text-muted-foreground">
          Subscribe via RSS, or open Tech Weekly every Sunday for the next
          engineering cycle.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="rounded-md">
            <a href="/feed.xml">Journal RSS</a>
          </Button>
          <Button asChild variant="outline" className="rounded-md">
            <Link href="/tech-weekly">This week’s Tech Weekly</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
