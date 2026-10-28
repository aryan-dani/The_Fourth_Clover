import Image from "next/image";
import { Byline, type BylineAuthor } from "@/components/editorial/Byline";
import { ReadingProgress } from "@/components/editorial/ReadingProgress";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { cn } from "@/lib/utils";

export type ArticleHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type ArticleLayoutProps = {
  sectionLabel: string;
  sectionHref?: string;
  /** Short script flourish only — never a full title (legibility). */
  scriptKicker?: string;
  title: string;
  dek?: string | null;
  author?: BylineAuthor | null;
  publishedAt?: string | null;
  readTime?: number | null;
  coverImage?: string | null;
  coverAlt?: string;
  headings?: ArticleHeading[];
  children: React.ReactNode;
  reactions?: React.ReactNode;
  comments?: React.ReactNode;
  related?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  showProgress?: boolean;
};

function defaultKicker(sectionLabel: string): string {
  const s = sectionLabel.toLowerCase();
  if (s.includes("tech") || s.includes("csi") || s.includes("week")) {
    return "Dispatch";
  }
  if (s.includes("poet")) return "Verse";
  return "Essay";
}

export function ArticleLayout({
  sectionLabel,
  sectionHref,
  scriptKicker,
  title,
  dek,
  author,
  publishedAt,
  readTime,
  coverImage,
  coverAlt,
  headings,
  children,
  reactions,
  comments,
  related,
  actions,
  className,
  showProgress = true,
}: ArticleLayoutProps) {
  const hasToc = Boolean(headings && headings.length > 0);
  const kicker = (scriptKicker || defaultKicker(sectionLabel)).trim().slice(0, 24);

  return (
    <>
      {showProgress && <ReadingProgress targetSelector="#article-body" />}

      <article className={cn("mx-auto w-full max-w-reading", className)}>
        <header className="space-y-5 border-b border-hairline pb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionLabel href={sectionHref}>{sectionLabel}</SectionLabel>
            {actions}
          </div>

          <p
            className="type-script text-[clamp(2.4rem,6vw,3.25rem)] leading-none text-[var(--brand-color)]"
            aria-hidden="true"
          >
            {kicker}
          </p>

          <h1 className="type-display text-[clamp(2rem,5vw,3.25rem)] text-foreground">
            {title}
          </h1>

          {dek && (
            <p className="type-body text-lg md:text-xl">
              {dek}
            </p>
          )}

          {author && (
            <Byline
              author={author}
              publishedAt={publishedAt}
              readTime={readTime}
            />
          )}
        </header>

        {coverImage && (
          <figure className="mt-8 overflow-hidden border border-hairline">
            <div className="relative aspect-[16/9] w-full bg-muted">
              <Image
                src={coverImage}
                alt={coverAlt || title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 42rem"
                className="object-cover"
              />
            </div>
          </figure>
        )}

        {hasToc && (
          <nav
            aria-label="Table of contents"
            className="mt-8 border border-hairline px-5 py-4"
          >
            <p className="meta-label mb-3 text-brand">Contents</p>
            <ol className="space-y-2">
              {headings!.map((heading) => (
                <li
                  key={heading.id}
                  className={cn(heading.level === 3 && "pl-4")}
                >
                  <a
                    href={`#${heading.id}`}
                    className="text-sm text-muted-foreground transition-colors duration-expo hover:text-foreground"
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div id="article-body" className="mt-10">
          {children}
        </div>

        {reactions && (
          <div className="mt-10 border-t border-hairline pt-6">{reactions}</div>
        )}

        {comments && (
          <div className="mt-10 border-t border-hairline pt-8">{comments}</div>
        )}

        {related && (
          <aside className="mt-12 border-t border-hairline pt-8">{related}</aside>
        )}
      </article>
    </>
  );
}
