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
          "group flex gap-4 border-b border-hairline py-4 last:border-b-0",
          className,
        )}
      >
        {coverImage && (
          <Link
            href={href}
            className="relative hidden h-20 w-28 shrink-0 overflow-hidden border border-hairline bg-muted sm:block"
          >
            <Image
              src={coverImage}
              alt=""
              fill
              sizes="112px"
              className="object-cover transition-transform duration-editorial group-hover:scale-[1.02]"
            />
          </Link>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <SectionLabel href={meta.href}>{meta.label}</SectionLabel>
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
            <Link
              href={href}
              className="transition-colors duration-editorial hover:text-brand"
            >
              {title}
            </Link>
          </h3>
          {author && (
            <Byline
              author={author}
              publishedAt={publishedAt}
              readTime={readTime}
              size="sm"
            />
          )}
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className={cn("group space-y-2", className)}>
        <SectionLabel href={meta.href}>{meta.label}</SectionLabel>
        <h3 className="font-display text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
          <Link
            href={href}
            className="transition-colors duration-editorial hover:text-brand"
          >
            {title}
          </Link>
        </h3>
        {excerpt && (
          <p className="line-clamp-2 font-serif text-sm leading-relaxed text-muted-foreground">
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
      </article>
    );
  }

  const isLead = variant === "lead";

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden border border-hairline bg-background transition-colors duration-editorial hover:border-brand/35",
        isLead && "md:grid md:grid-cols-2 md:items-stretch",
        className,
      )}
    >
      {coverImage && (
        <Link
          href={href}
          className={cn(
            "relative block w-full overflow-hidden bg-muted",
            isLead
              ? "aspect-[16/10] md:aspect-auto md:min-h-[18rem]"
              : "aspect-[16/10]",
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
        </Link>
      )}

      <div
        className={cn(
          "flex flex-1 flex-col gap-3 p-5 sm:p-6",
          isLead && "justify-center md:p-8",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <SectionLabel href={meta.href}>{meta.label}</SectionLabel>
          {format === "poetry" && section === "journal" && (
            <span className="meta-label">Verse</span>
          )}
        </div>

        <h2
          className={cn(
            "font-display font-semibold tracking-tight text-foreground",
            isLead
              ? "text-display-sm md:text-display-md"
              : "text-xl leading-snug",
          )}
        >
          <Link
            href={href}
            className="transition-colors duration-editorial hover:text-brand"
          >
            {title}
          </Link>
        </h2>

        {excerpt && (
          <p
            className={cn(
              "font-serif leading-relaxed text-muted-foreground",
              isLead ? "line-clamp-4 text-base md:text-lg" : "line-clamp-3 text-sm",
            )}
          >
            {excerpt}
          </p>
        )}

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-hairline pt-4">
          {author ? (
            <Byline
              author={author}
              publishedAt={publishedAt}
              readTime={readTime}
              size="sm"
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
