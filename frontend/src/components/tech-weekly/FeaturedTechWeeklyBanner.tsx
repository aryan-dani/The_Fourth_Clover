"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { TechSubmissionWithAuthor } from "@/types/database";

export function formatLinkedInPostText(
  submission: TechSubmissionWithAuthor,
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
      match.replace(/```\w*\n?/g, "").trim(),
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
    new Set([...customTags, ...defaultHashtags]),
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
      className="gap-2 font-mono text-xs uppercase tracking-wider"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
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
  const authorMeta = [
    submission.author?.dept ? `CSI ${submission.author.dept}` : null,
    submission.author?.year || null,
    submission.author?.csi_id ? `#${submission.author.csi_id}` : null,
    submission.read_time ? `${submission.read_time} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const excerpt =
    submission.summary?.trim() ||
    submission.content
      .replace(/[#*`>\-\[\]!]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240) + "...";

  return (
    <section className="panel overflow-hidden">
      <div className="panel-header">
        <p className="type-label text-foreground">
          Weekly featured · CSI LinkedIn
        </p>
        {submission.week?.title && (
          <p className="type-label text-muted-foreground">
            {submission.week.title}
          </p>
        )}
      </div>

      <div
        className={
          submission.cover_image && !compact
            ? "grid gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:items-center lg:gap-10 lg:p-10"
            : "space-y-5 p-6 sm:p-8"
        }
      >
        <div
          className={
            submission.cover_image && !compact
              ? "space-y-5 lg:col-span-7"
              : "max-w-3xl space-y-5"
          }
        >
          {submission.tags && submission.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {submission.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="type-label text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h2 className="type-display text-[clamp(1.6rem,4vw,2.75rem)] text-foreground">
            <Link
              href={`/tech-weekly/${submission.slug}`}
              className="transition-opacity hover:opacity-70"
            >
              {submission.title}
            </Link>
          </h2>

          <p className="type-body max-w-2xl text-base">{excerpt}</p>

          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[var(--fg-line)] pt-5">
            <div>
              <p className="type-person text-base text-foreground">
                {authorName}
              </p>
              {authorMeta && (
                <p className="type-label mt-1 text-muted-foreground">
                  {authorMeta}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/tech-weekly/${submission.slug}`}
                className="btn-editorial--solid btn-editorial !py-2.5 !px-4 text-[0.68rem]"
              >
                Read dispatch
              </Link>
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
              className="relative block aspect-[16/10] w-full overflow-hidden border border-[var(--fg-line)] bg-muted"
            >
              <Image
                src={submission.cover_image}
                alt={submission.title}
                fill
                priority
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
