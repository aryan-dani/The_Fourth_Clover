"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, ArrowUpRight, Clock } from "lucide-react";
import { toast } from "sonner";
import type { TechSubmissionWithAuthor } from "@/types/database";

export function formatLinkedInPostText(
  submission: TechSubmissionWithAuthor
): string {
  const authorName =
    submission.author?.full_name?.trim() ||
    submission.author?.username ||
    "CSI Technical Member";

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
    "#SoftwareEngineering",
    "#SystemsDesign",
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
  variant = "outline",
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
      toast.success("Copied formatted LinkedIn dispatch to clipboard.");
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
      className="rounded-md gap-2 font-mono text-xs uppercase tracking-wider"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied LinkedIn Copy
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy for LinkedIn
        </>
      )}
    </Button>
  );
}

export function FeaturedTechWeeklyBanner({
  submission,
  canCopyLinkedIn = false,
  compact = false,
}: {
  submission: TechSubmissionWithAuthor;
  canCopyLinkedIn?: boolean;
  compact?: boolean;
}) {
  const authorName =
    submission.author?.full_name ||
    submission.author?.username ||
    "CSI Member";
  const authorBadge = submission.author?.dept
    ? `CSI ${submission.author.dept}${submission.author.year ? ` · ${submission.author.year}` : ""}`
    : "CSI Technical Wing";

  const excerpt =
    submission.summary?.trim() ||
    submission.content
      .replace(/[#*`>\-\[\]!]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240) + "...";

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Top Issue Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 rounded-full bg-foreground" />
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-foreground">
            Weekly Featured Selection · Official CSI LinkedIn Dispatch
          </span>
        </div>
        {submission.week?.title && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {submission.week.title}
          </span>
        )}
      </div>

      <div
        className={`grid gap-8 p-6 sm:p-8 lg:p-10 ${
          submission.cover_image && !compact
            ? "lg:grid-cols-12 lg:items-center"
            : "grid-cols-1"
        }`}
      >
        <div
          className={
            submission.cover_image && !compact
              ? "lg:col-span-7 space-y-5"
              : "space-y-5 max-w-3xl"
          }
        >
          {submission.tags && submission.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {submission.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground border border-border px-2 py-0.5 rounded-sm bg-background"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-[1.15]">
            <Link
              href={`/tech-weekly/${submission.slug}`}
              className="hover:underline decoration-1 underline-offset-4"
            >
              {submission.title}
            </Link>
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {excerpt}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/80">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-sm border border-border">
                <AvatarImage src={submission.author?.avatar_url || ""} />
                <AvatarFallback className="rounded-sm font-mono text-xs">
                  {authorName[0]?.toUpperCase() || "C"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground leading-none">
                  {authorName}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {authorBadge}
                  {submission.author?.csi_id
                    ? ` · #${submission.author.csi_id}`
                    : ""}{" "}
                  · <Clock className="inline h-3 w-3 -mt-0.5" />{" "}
                  {submission.read_time} min read ({submission.word_count} words)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button asChild size="sm" className="rounded-md px-4 text-xs">
                <Link href={`/tech-weekly/${submission.slug}`}>
                  Read Dispatch
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              {canCopyLinkedIn && (
                <CopyForLinkedInButton submission={submission} size="sm" />
              )}
            </div>
          </div>
        </div>

        {submission.cover_image && !compact && (
          <div className="lg:col-span-5">
            <Link
              href={`/tech-weekly/${submission.slug}`}
              className="block relative aspect-[16/10] w-full overflow-hidden rounded-md border border-border bg-muted"
            >
              <Image
                src={submission.cover_image}
                alt={submission.title}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
