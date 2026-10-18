"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
} from "lucide-react";
import { motionEase } from "@/lib/motion";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        {/* Ambient radial background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.14),transparent_68%)]"
        />

        <Header />

        <main className="relative flex flex-1 flex-col items-center justify-center">
          <section className="w-full px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-4xl">
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
                    Home of the CSI MIT-WPU Tech Blog
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
                  A focused editorial space for writers and engineers who care
                  about craft. Publish long-form essays, explore deep technical
                  tutorials, and collaborate with the CSI MIT-WPU community.
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
                    className="group rounded-full px-8 shadow-md"
                  >
                    <Link href={user ? "/write" : "/auth/signup"}>
                      <Feather className="mr-2 h-4 w-4" />
                      {user ? "Start Writing" : "Get Started"}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    asChild
                    className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 group rounded-full border px-8"
                  >
                    <Link href="/csi">
                      <Terminal className="mr-2 h-4 w-4" />
                      CSI Tech Blog
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="rounded-full px-8"
                  >
                    <Link href="/explore">Explore Stories</Link>
                  </Button>
                </m.div>
              </m.div>

              {/* Editorial & CSI Highlights */}
              <m.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.22, ease: motionEase }}
                className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3"
              >
                <Link href="/csi" className="group block">
                  <Card className="glass-card border-border/60 hover:border-primary/40 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="bg-primary/12 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
                        <Terminal className="h-5 w-5" aria-hidden />
                      </div>
                      <h2 className="font-display group-hover:text-primary mb-1.5 text-base font-bold tracking-tight transition-colors">
                        CSI Technical Wing
                      </h2>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        Technical members publish engineering tutorials with
                        syntax-highlighted code and multi-image architecture
                        diagrams from Sunday to Wednesday.
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/csi" className="group block">
                  <Card className="glass-card border-border/60 hover:border-primary/40 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="bg-primary/12 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
                        <Award className="h-5 w-5" aria-hidden />
                      </div>
                      <h2 className="font-display group-hover:text-primary mb-1.5 text-base font-bold tracking-tight transition-colors">
                        Wednesday LinkedIn Feature
                      </h2>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        Every Wednesday, CSI Technical Heads select the standout
                        article of the week to go live for official CSI MIT-WPU
                        LinkedIn reposting.
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
                        Peer Review & Community
                      </h2>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        Read, like, and discuss submissions across the community
                        with fast page transitions and distraction-free
                        typography.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </m.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </LazyMotion>
  );
}

