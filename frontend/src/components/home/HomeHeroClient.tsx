"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";
import {
  ArrowRight,
  Feather,
  Terminal,
  Sparkles,
  Award,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { motionEase } from "@/lib/motion";
import { FeaturedTechWeeklyBanner } from "@/components/tech-weekly/FeaturedTechWeeklyBanner";
import type { TechSubmissionWithAuthor } from "@/types/database";

export function HomeHeroClient({
  featuredPick,
}: {
  featuredPick: TechSubmissionWithAuthor | null;
}) {
  const { user, profile } = useAuth();
  const isVerifiedTech =
    profile?.role === "tech_member" ||
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    Boolean(profile?.is_admin);

  const primaryWriteHref = !user
    ? "/auth/signin"
    : isVerifiedTech
    ? "/tech-weekly/write"
    : "/verify-csi";

  return (
    <LazyMotion features={domAnimation}>
      <section className="w-full px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-12">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: motionEase }}
            className="text-center"
          >
            <m.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: motionEase }}
              className="mb-5 flex flex-col items-center justify-center gap-3 sm:mb-7"
            >
              <div className="border-border/80 bg-muted/40 ring-background rounded-full border p-4 shadow-md ring-4 transition-transform duration-300 hover:scale-105 sm:p-5">
                <span
                  className="text-5xl leading-none md:text-6xl"
                  aria-hidden
                >
                  🍀
                </span>
              </div>
              <Badge
                variant="secondary"
                className="border-primary/25 bg-primary/10 text-primary gap-1.5 rounded-full border px-3.5 py-1 text-xs font-medium"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Home of CSI MIT-WPU Tech Weekly
              </Badge>
            </m.div>

            <m.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: motionEase }}
              className="font-display text-foreground text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
            >
              <span className="gradient-text">The Fourth Clover</span>
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: motionEase }}
              className="text-muted-foreground mx-auto mt-5 max-w-2xl font-serif text-lg leading-relaxed sm:mt-6 sm:text-xl"
            >
              A focused editorial space for engineers and writers who care about
              craft. Verified CSI MIT-WPU technical members publish weekly
              deep-dives from Sunday to Wednesday, with one standout article
              featured on LinkedIn every week.
            </m.p>

            <m.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: motionEase }}
              className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4"
            >
              <Button
                size="lg"
                asChild
                className="group rounded-full px-8 shadow-md bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Link href="/tech-weekly">
                  <Terminal className="mr-2 h-4 w-4" />
                  CSI Tech Weekly
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 group rounded-full border px-8"
              >
                <Link href={primaryWriteHref}>
                  {isVerifiedTech ? (
                    <>
                      <Feather className="mr-2 h-4 w-4" />
                      Submit This Week&apos;s Article
                    </>
                  ) : user ? (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify Your CSI ID
                    </>
                  ) : (
                    <>
                      <Feather className="mr-2 h-4 w-4" />
                      Sign in with Google
                    </>
                  )}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-full px-8"
              >
                <Link href="/explore">Explore Archive</Link>
              </Button>
            </m.div>
          </m.div>

          {/* This week's featured post */}
          {featuredPick && (
            <FeaturedTechWeeklyBanner submission={featuredPick} />
          )}

          {/* Editorial & CSI Highlights */}
          <m.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22, ease: motionEase }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <Link href="/tech-weekly" className="group block">
              <Card className="glass-card border-border/60 hover:border-primary/40 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="bg-primary/12 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
                    <Terminal className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="font-display group-hover:text-primary mb-1.5 text-base font-bold tracking-tight transition-colors">
                    Sunday to Wednesday Window
                  </h2>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Verified CSI Technical members submit engineering tutorials
                    and architecture breakdowns until Wednesday 09:00 IST.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tech-weekly" className="group block">
              <Card className="glass-card border-border/60 hover:border-primary/40 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="bg-primary/12 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
                    <Award className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="font-display group-hover:text-primary mb-1.5 text-base font-bold tracking-tight transition-colors">
                    Wednesday LinkedIn Pick
                  </h2>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Every Wednesday, CSI Technical Heads select one standout
                    article for official CSI MIT-WPU LinkedIn publication.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/explore" className="group block">
              <Card className="glass-card border-border/60 hover:border-primary/40 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="bg-primary/12 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
                    <BookOpen className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="font-display group-hover:text-primary mb-1.5 text-base font-bold tracking-tight transition-colors">
                    Peer Review &amp; Leaderboard
                  </h2>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    React with Like, Insightful, or Fire, join threaded
                    discussions, and climb the CSI Tech Weekly leaderboard.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </m.div>
        </div>
      </section>
    </LazyMotion>
  );
}
