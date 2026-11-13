import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Byline, type BylineAuthor } from "@/components/editorial/Byline";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { TagChip } from "@/components/editorial/TagChip";
import { cn } from "@/lib/utils";

export type ArticleCardSection = "journal" | "tech";
export type ArticleCardVariant = "lead" | "standard" | "compact" | "list";
export type ArticleFormat = "prose" | "poetry";

export type ArticleCardProps = {
  section: ArticleCardSection;
  variant?: ArticleCardVariant;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  author?: BylineAuthor | null;
  publishedAt?: string | null;
  readTime?: number | null;
  tags?: string[] | null;
  format?: ArticleFormat;
  anonymous?: boolean;
  reactionCount?: number | null;
  commentCount?: number | null;
  className?: string;
  priority?: boolean;
};

function articleHref(section: ArticleCardSection, slug: string): string {
  return section === "tech" ? `/tech-weekly/${slug}` : `/post/${slug}`;
}

function sectionMeta(section: ArticleCardSection, format?: ArticleFormat) {
  if (section === "tech") {
    return { label: "Tech Weekly", href: "/tech-weekly" as const };
  }
  if (format === "poetry") {
    return { label: "Poetry", href: "/journal?format=poetry" as const };
  }
  return { label: "Journal", href: "/journal" as const };
}

/**
 * Nested controls stay clickable above the stretched card link.
 * Content without this class uses pointer-events-none so the overlay Link receives clicks.
 */
const nest = "relative z-10 pointer-events-auto";

/** Card titles need air — override .type-display's 0.88 crush and negative tracking. */
const cardTitleLeading =
  "leading-[1.32] tracking-[0.02em] [word-spacing:0.12em]";
const cardExcerptLeading = "leading-[1.7]";

export function ArticleCard({
  section,
  variant = "standard",
  title,
  slug,
  excerpt,
  coverImage,
  author,
  publishedAt,
  readTime,
  tags,
  format = "prose",
  anonymous = false,
  reactionCount,
  commentCount,
  className,
  priority = false,
}: ArticleCardProps) {
  const href = articleHref(section, slug);
  const meta = sectionMeta(section, format);
  const visibleTags = (tags ?? []).filter(Boolean).slice(0, 3);
  const showStats =
    (reactionCount != null && reactionCount > 0) ||
    (commentCount != null && commentCount > 0);

  if (variant === "list") {
    return (
      <article
        className={cn(
          "group relative flex gap-4 border-b border-hairline py-4 last:border-b-0",
          className,
        )}
      >
        <Link
          href={href}
          className="absolute inset-0 z-0"
          aria-label={title}
        />
        {coverImage && (
          <div className="pointer-events-none relative hidden h-20 w-28 shrink-0 overflow-hidden border border-hairline bg-muted sm:block">
            <Image
              src={coverImage}
              alt=""
              fill
              sizes="112px"
              className="object-cover transition-transform duration-editorial group-hover:scale-[1.02]"
            />
          </div>
        )}
        <div className="pointer-events-none min-w-0 flex-1 space-y-2">
          <SectionLabel href={meta.href} className={nest}>
            {meta.label}
          </SectionLabel>
          <h3
            className={cn(
              "type-display text-[clamp(1.05rem,2.2vw,1.35rem)] text-foreground transition-opacity group-hover:opacity-70",
              cardTitleLeading,
            )}
          >
            {title}
          </h3>
          {author && (
            <Byline
              author={author}
              publishedAt={publishedAt}
              readTime={readTime}
              size="sm"
              className={nest}
              anonymous={anonymous}
            />
          )}
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className={cn("group relative space-y-2.5", className)}>
        <Link
          href={href}
          className="absolute inset-0 z-0"
          aria-label={title}
        />
        <div className="pointer-events-none space-y-2.5">
          <SectionLabel href={meta.href} className={nest}>
            {meta.label}
          </SectionLabel>
          <h3
            className={cn(
              "type-display text-[clamp(1rem,2vw,1.25rem)] text-foreground transition-opacity group-hover:opacity-70",
              cardTitleLeading,
            )}
          >
            {title}
          </h3>
          {excerpt && (
            <p
              className={cn(
                "line-clamp-2 font-serif text-sm text-muted-foreground",
                cardExcerptLeading,
              )}
            >
              {excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {publishedAt && (
              <time dateTime={publishedAt}>
                {new Date(publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </time>
            )}
            {readTime != null && readTime > 0 && (
              <span className="tabular-nums">{readTime} min</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  const isLead = variant === "lead";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden border border-[var(--fg-line)] bg-[hsl(var(--card))] transition-opacity",
        isLead && "md:grid md:grid-cols-2 md:items-stretch",
        className,
      )}
    >
      <Link href={href} className="absolute inset-0 z-0" aria-label={title} />

      {coverImage && (
        <div
          className={cn(
            "pointer-events-none relative block w-full overflow-hidden bg-muted",
            isLead
              ? "aspect-[16/10] md:aspect-auto md:min-h-[16rem]"
              : "aspect-[2/1]",
          )}
        >
          <Image
            src={coverImage}
            alt=""
            fill
            priority={priority || isLead}
            sizes={
              isLead
                ? "(max-width: 768px) 100vw, 50vw"
                : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            }
            className="object-cover transition-transform duration-editorial group-hover:scale-[1.02]"
          />
        </div>
      )}

      <div
        className={cn(
          "pointer-events-none flex flex-col gap-3.5 p-5 sm:p-6",
          isLead && "flex-1 justify-center md:p-8",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <SectionLabel href={meta.href} className={nest}>
            {meta.label}
          </SectionLabel>
          {format === "poetry" && section === "journal" && (
            <span className="meta-label">Verse</span>
          )}
        </div>

        <h2
          className={cn(
            "type-display text-foreground transition-opacity group-hover:opacity-70",
            cardTitleLeading,
            isLead
              ? "text-[clamp(1.5rem,3.5vw,2.4rem)]"
              : "line-clamp-4 text-[clamp(1.15rem,2.5vw,1.45rem)]",
          )}
        >
          {title}
        </h2>

        {excerpt && (
          <p
            className={cn(
              "font-serif text-muted-foreground",
              cardExcerptLeading,
              isLead
                ? "line-clamp-4 text-base md:text-lg"
                : "line-clamp-3 text-sm",
            )}
          >
            {excerpt}
          </p>
        )}

        {visibleTags.length > 0 && (
          <div className={cn("flex flex-wrap gap-1.5", nest)}>
            {visibleTags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        )}

        <div
          className={cn(
            "flex flex-wrap items-end justify-between gap-3 border-t border-hairline pt-4",
            isLead && "mt-auto",
          )}
        >
          {author ? (
            <Byline
              author={author}
              publishedAt={publishedAt}
              readTime={readTime}
              size="sm"
              className={nest}
              anonymous={anonymous}
            />
          ) : (
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              {readTime != null && readTime > 0 && (
                <span className="tabular-nums">{readTime} min read</span>
              )}
            </div>
          )}

          {showStats && (
            <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-muted-foreground">
              {reactionCount != null && reactionCount > 0 && (
                <span>{reactionCount}</span>
              )}
              {commentCount != null && commentCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" aria-hidden />
                  {commentCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
