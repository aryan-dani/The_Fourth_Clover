"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";
import { ArrowRight, Feather } from "lucide-react";
import { motionEase } from "@/lib/motion";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />

      <main className="relative flex flex-1 flex-col items-center justify-center">
        <section className="w-full px-4 py-10 sm:py-12">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, ease: motionEase }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.55, ease: motionEase }}
                className="mb-6 flex justify-center sm:mb-8"
              >
                <div className="rounded-full border border-border bg-muted/40 p-4 shadow-md ring-4 ring-background sm:p-5">
                  <span className="text-5xl leading-none md:text-6xl" aria-hidden>
                    🍀
                  </span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08, ease: motionEase }}
                className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              >
                <span className="gradient-text">The Fourth Clover</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16, ease: motionEase }}
                className="mx-auto mt-5 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground sm:mt-6 sm:text-xl"
              >
                A quiet, editorial space for writers who care about craft.
                Share stories, discover voices, stay rooted in what matters.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.24, ease: motionEase }}
                className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
              >
                <Button size="lg" asChild className="group rounded-full px-10 shadow-md">
                  <Link href={user ? "/write" : "/auth/signup"}>
                    <Feather className="mr-2 h-4 w-4" />
                    {user ? "Write" : "Get started"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full px-10">
                  <Link href="/explore">Explore stories</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
