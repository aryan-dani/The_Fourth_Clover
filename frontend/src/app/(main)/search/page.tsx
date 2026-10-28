import Link from "next/link";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { EmptyState } from "@/components/editorial/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { searchContentAction } from "@/features/data/search-actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  if (!query) {
    return {
      title: "Search | The Fourth Clover",
      description: "Search Journal stories, Tech Weekly dispatches, and authors.",
    };
  }
  return {
    title: `Search: ${query} | The Fourth Clover`,
    description: `Results for “${query}” on The Fourth Clover.`,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const { hits } = q.length >= 2 ? await searchContentAction(q, 40) : { hits: [] };
  const authors = hits.filter((h) => h.kind === "author");
  const pieces = hits.filter((h) => h.kind !== "author");

  return (
    <PageShell
      title={q ? `Results for “${q}”` : "Search"}
      description="Journal essays, Tech Weekly dispatches, and authors."
    >
      <form
        action="/search"
        method="get"
        className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <label htmlFor="search-q" className="sr-only">
          Search query
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search titles, excerpts, and authors…"
          className="h-11 w-full flex-1 border border-[var(--fg-line)] bg-transparent px-4 text-base text-foreground outline-none transition-colors duration-expo placeholder:text-muted-foreground focus:border-[var(--fg)]"
          autoFocus
        />
        <button type="submit" className="btn-editorial shrink-0">
          Search
        </button>
      </form>

      <div className="mt-10 space-y-10">
        {q.length < 2 ? (
          <EmptyState
            title="Start a search"
            description="Enter at least two characters, or open the command palette with ⌘K / Ctrl+K."
            action={
              <Link href="/journal" className="btn-editorial">
                Browse Journal
              </Link>
            }
          />
        ) : hits.length === 0 ? (
          <EmptyState
            title="No matches"
            description={`Nothing turned up for “${q}”. Try a name, title, or broader phrase.`}
            action={
              <Link href="/tags" className="btn-editorial">
                Explore tags
              </Link>
            }
          />
        ) : (
          <>
            <p className="type-label text-muted-foreground">
              {hits.length} result{hits.length === 1 ? "" : "s"}
            </p>

            {authors.length > 0 && (
              <section className="space-y-3">
                <h2 className="type-label text-muted-foreground">Authors</h2>
                <ul className="divide-y divide-[var(--fg-line)] border-y border-[var(--fg-line)]">
                  {authors.map((hit) => (
                    <li key={`author-${hit.id}`}>
                      <Link
                        href={`/profile/${hit.slug}`}
                        className="group flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between"
                      >
                        <span className="text-lg tracking-tight transition-opacity group-hover:opacity-70">
                          {hit.title}
                        </span>
                        <span className="type-label text-muted-foreground">
                          @{hit.slug}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {pieces.length > 0 && (
              <section className="space-y-3">
                <h2 className="type-label text-muted-foreground">Pieces</h2>
                <div className="space-y-1">
                  {pieces.map((hit) => (
                    <ArticleCard
                      key={`${hit.kind}-${hit.id}`}
                      section={hit.kind === "tech" ? "tech" : "journal"}
                      variant="list"
                      title={hit.title}
                      slug={hit.slug}
                      excerpt={hit.excerpt}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
