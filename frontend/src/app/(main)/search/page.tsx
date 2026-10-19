import Link from "next/link";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { EmptyState } from "@/components/editorial/EmptyState";
import { PageHeader } from "@/components/editorial/PageHeader";
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
      description: "Search Journal stories and Tech Weekly dispatches.",
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

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        label="Discover"
        labelHref="/journal"
        title={q ? `Results for “${q}”` : "Search"}
        description={
          q.length > 0 && q.length < 2
            ? "Type at least two characters to search."
            : "Journal essays and Tech Weekly dispatches."
        }
      />

      <form
        action="/search"
        method="get"
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <label htmlFor="search-q" className="sr-only">
          Search query
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search titles and excerpts…"
          className="h-11 w-full flex-1 border border-hairline bg-background px-4 font-serif text-base text-foreground outline-none transition-colors duration-editorial placeholder:text-muted-foreground focus:border-brand"
          autoFocus
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center border border-foreground bg-foreground px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-background transition-colors duration-editorial hover:bg-brand hover:border-brand"
        >
          Search
        </button>
      </form>

      <div className="mt-10">
        {q.length < 2 ? (
          <EmptyState
            title="Start a search"
            description="Enter at least two characters, or open the command palette with ⌘K / Ctrl+K."
            action={
              <Link
                href="/journal"
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand transition-colors hover:text-foreground"
              >
                Browse Journal
              </Link>
            }
          />
        ) : hits.length === 0 ? (
          <EmptyState
            title="No matches"
            description={`Nothing turned up for “${q}”. Try a broader phrase or browse by tag.`}
            action={
              <Link
                href="/tags"
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand transition-colors hover:text-foreground"
              >
                Explore tags
              </Link>
            }
          />
        ) : (
          <div className="space-y-1">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {hits.length} result{hits.length === 1 ? "" : "s"}
            </p>
            {hits.map((hit) => (
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
        )}
      </div>
    </div>
  );
}
