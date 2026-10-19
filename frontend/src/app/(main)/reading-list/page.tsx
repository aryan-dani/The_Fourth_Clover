import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { EmptyState } from "@/components/editorial/EmptyState";
import { PageHeader } from "@/components/editorial/PageHeader";
import { listBookmarks } from "@/features/data/bookmark-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reading list | The Fourth Clover",
  description: "Pieces you have saved for later.",
  robots: { index: false, follow: false },
};

export default async function ReadingListPage() {
  const { items, authenticated, error } = await listBookmarks();

  if (!authenticated) {
    redirect("/auth/signin");
  }

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        label="Library"
        title="Reading list"
        description="Stories and Tech Weekly dispatches you have saved."
      />

      <div className="mt-10">
        {error ? (
          <EmptyState
            title="Could not load bookmarks"
            description={error}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            description="Use Save on any article to build a private reading list."
            action={
              <Link
                href="/journal"
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand transition-colors hover:text-foreground"
              >
                Browse Journal
              </Link>
            }
          />
        ) : (
          <div className="space-y-1">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {items.length} saved
            </p>
            {items.map((item) => (
              <ArticleCard
                key={item.id}
                section={item.section}
                variant="list"
                title={item.title}
                slug={item.slug}
                excerpt={item.excerpt}
                coverImage={item.coverImage}
                publishedAt={item.createdAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
