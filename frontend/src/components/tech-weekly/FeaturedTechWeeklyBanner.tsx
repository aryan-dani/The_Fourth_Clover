"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Award,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { TechSubmissionWithAuthor } from "@/types/database";

export function formatLinkedInPostText(
  submission: TechSubmissionWithAuthor
): string {
  const authorName =
    submission.author?.full_name?.trim() ||
    submission.author?.username ||
    "CSI Technical Member";

  // Convert markdown to clean LinkedIn-friendly text
  const cleanBody = (submission.content || "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/```\w*\n?/g, "").trim()
    )
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const customTags = (submission.tags || [])
    .slice(0, 5)
    .map((t) => `#${t.replace(/[^a-zA-Z0-9]/g, "")}`)
    .filter((t) => t.length > 1);

  const defaultHashtags = [
    "#CSIMITWPU",
    "#CSITechWeekly",
    "#Engineering",
    "#TechCommunity",
  ];
  const allHashtags = Array.from(
    new Set([...customTags, ...defaultHashtags])
  ).join(" ");

  return [
    submission.title.trim(),
    "",
    cleanBody,
    "",
    `Written by ${authorName}, CSI Tech Weekly`,
    "",
    allHashtags,
  ].join("\n");
}

export function CopyForLinkedInButton({
  submission,
  size = "default",
  variant = "default",
}: {
  submission: TechSubmissionWithAuthor;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const text = formatLinkedInPostText(submission);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied ready-to-paste LinkedIn post!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={() => void handleCopy()}
      className="rounded-xl gap-2 font-medium"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-500" />
          Copied for LinkedIn
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy for LinkedIn
        </>
      )}
    </Button>
  );
}

export function FeaturedTechWeeklyBanner({
  submission,
  compact = false,
}: {
  submission: TechSubmissionWithAuthor;
  compact?: boolean;
}) {
  const authorName =
    submission.author?.full_name || submission.author?.username || "CSI Writer";

  return (
    <LazyMotion features={domAnimation}>
      <m.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        aria-label="This week's featured post"
        className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/12 via-emerald-500/8 to-card/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <div className="space-y-4 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-400 font-semibold px-3 py-1 rounded-full">
                <Award className="h-3.5 w-3.5 mr-1.5" />
                This week&apos;s featured post
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Official CSI LinkedIn Pick
              </Badge>
              {submission.week?.title && (
                <span className="text-xs text-muted-foreground font-medium">
                  {submission.week.title}
                </span>
              )}
            </div>

            <Link
              href={`/tech-weekly/${submission.slug}`}
              className="block group"
            >
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {submission.title}
              </h2>
            </Link>

            <p className="font-serif text-muted-foreground text-sm sm:text-base line-clamp-3 max-w-3xl leading-relaxed">
              {submission.summary ||
                submission.content
                  .replace(/[#*`>\[\]!]/g, "")
                  .slice(0, 240)
                  .trim() + "..."}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-amber-500/30">
                  <AvatarImage src={submission.author?.avatar_url || ""} />
                  <AvatarFallback className="text-xs font-bold">
                    {authorName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {authorName}
                    </span>
                    {submission.author?.dept && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-2 py-0 h-4"
                      >
                        CSI {submission.author.dept}
                        {submission.author.year
                          ? ` · ${submission.author.year}`
                          : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{submission.read_time} min read</span>
                    <span>·</span>
                    <span>{submission.word_count} words</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <CopyForLinkedInButton
                  submission={submission}
                  variant="outline"
                  size="sm"
                />
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Link href={`/tech-weekly/${submission.slug}`}>
                    Read Article
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {!compact && submission.cover_image && (
            <Link
              href={`/tech-weekly/${submission.slug}`}
              className="lg:w-72 shrink-0 overflow-hidden rounded-2xl border border-border/60 aspect-video relative bg-muted/30"
            >
              <Image
                src={submission.cover_image}
                alt={submission.title}
                width={560}
                height={315}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </Link>
          )}
        </div>
      </m.section>
    </LazyMotion>
  );
}
