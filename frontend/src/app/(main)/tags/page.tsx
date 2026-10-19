import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/editorial/EmptyState";
import { PageHeader } from "@/components/editorial/PageHeader";
import { listPopularTags } from "@/features/data/discovery-queries";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Tags | The Fourth Clover",
  description: "Browse popular topics across Journal stories.",
};

export default async function TagsIndexPage() {
  const tags = await listPopularTags(64);

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        label="Discover"
        labelHref="/journal"
        title="Tags"
        description="Topics writers keep returning to across the Journal."
      />

      <div className="mt-10">
        {tags.length === 0 ? (
          <EmptyState
            title="No tags yet"
            description="When published stories carry tags, they will appear here."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map(({ tag, count }) => (
              <li key={tag.toLowerCase()}>
                <Link
                  href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                  className="group flex items-baseline justify-between gap-4 border border-hairline px-4 py-3 transition-colors duration-editorial hover:border-brand/40"
                >
                  <span className="font-display text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-brand">
                    {tag}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums uppercase tracking-[0.1em] text-muted-foreground">
                    {count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
