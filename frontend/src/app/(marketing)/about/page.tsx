"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github, Twitter, Linkedin, Globe } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageShell } from "@/components/layout/PageShell";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 pb-6">
        <PageShell
          variant="wide"
          title="About The Fourth Clover"
          description="A minimalist blogging platform built for thoughtful writers and readers."
        >
          <div className="space-y-12">
          {/* Mission Section */}
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="space-y-4 font-serif text-muted-foreground">
              <h2 className="font-display text-2xl font-semibold text-foreground">Our mission</h2>
              <p className="leading-relaxed">
                The Fourth Clover was created with a simple goal: to provide a
                distraction-free environment where ideas can flourish. In a world
                of noise, we believe in the power of written words to connect,
                inspire, and transform.
              </p>
              <p className="leading-relaxed">
                We focus on typography, readability, and community, ensuring that
                your stories are presented in the best possible light.
              </p>
            </div>
            <div className="surface-band flex aspect-video items-center justify-center rounded-xl border border-border/80 p-10">
              <span className="text-7xl md:text-8xl" aria-hidden>
                🍀
              </span>
            </div>
          </div>

          {/* Creator Section */}
          <div className="border-t border-border/60 pt-12">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-semibold mb-3">Meet the creator</h2>
              <p className="text-muted-foreground">The mind behind the code.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="w-48 h-48 bg-muted rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-4 border-background shadow-xl">
                <img
                  src="/images/aryan-dani.jpg"
                  alt="Aryan Dani"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left font-serif">
                <h3 className="font-display text-2xl font-semibold text-foreground">Aryan Dani</h3>
                <p className="font-sans text-sm font-medium text-primary">
                  Full Stack Developer & Creator
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Hi, I&apos;m Aryan! I built The Fourth Clover to explore the
                  intersection of modern web technology and classic storytelling.
                  I&apos;m passionate about building clean, accessible, and performant
                  web applications that solve real problems.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  This project showcases my expertise in Next.js, React, Supabase,
                  and modern UI design. I&apos;m always looking for new challenges and
                  opportunities to collaborate.
                </p>

                <div className="flex items-center justify-center md:justify-start gap-4 pt-4">
                  <Button variant="outline" size="icon" asChild>
                    <Link
                      href="https://github.com/aryan-dani"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="w-5 h-5" />
                      <span className="sr-only">GitHub</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="w-5 h-5" />
                      <span className="sr-only">Twitter</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link
                      href="https://www.linkedin.com/in/aryandani/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="w-5 h-5" />
                      <span className="sr-only">LinkedIn</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link
                      href="https://aryan-dani.github.io/Portfolio/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="w-5 h-5" />
                      <span className="sr-only">Website</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </PageShell>
      </main>
      <Footer />
    </div>
  );
}
