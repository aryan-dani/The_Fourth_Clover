"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github, Twitter, Linkedin, Globe } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <div className="space-y-12">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl brand-text">
              About The Fourth Clover
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A minimalist blogging platform built for thoughtful writers and
              readers.
            </p>
          </div>

          {/* Mission Section */}
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Fourth Clover was created with a simple goal: to provide a
                distraction-free environment where ideas can flourish. In a world
                of noise, we believe in the power of written words to connect,
                inspire, and transform.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We focus on typography, readability, and community, ensuring that
                your stories are presented in the best possible light.
              </p>
            </div>
            <div className="bg-muted rounded-lg p-8 flex items-center justify-center aspect-video">
              <span className="text-6xl">🍀</span>
            </div>
          </div>

          {/* Creator Section */}
          <div className="border-t pt-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Meet the Creator</h2>
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

              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-2xl font-bold">Aryan Dani</h3>
                <p className="text-primary font-medium">
                  Full Stack Developer & Creator
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Hi, I'm Aryan! I built The Fourth Clover to explore the
                  intersection of modern web technology and classic storytelling.
                  I'm passionate about building clean, accessible, and performant
                  web applications that solve real problems.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  This project showcases my expertise in Next.js, React, Supabase,
                  and modern UI design. I'm always looking for new challenges and
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
      </main>
      <Footer />
    </div>
  );
}
