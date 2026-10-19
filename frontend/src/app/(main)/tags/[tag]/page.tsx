import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { EmptyState } from "@/components/editorial/EmptyState";
import { PageHeader } from "@/components/editorial/PageHeader";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { fetchTagPageContent } from "@/features/data/discovery-queries";

export const revalidate = 60;

type TagParams = { tag: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<TagParams>;
}): Promise<Metadata> {
  const { tag } = await params;
  const { displayTag, posts, submissions } = await fetchTagPageContent(tag);
  const total = posts.length + submissions.length;
  return {
    title: `#${displayTag} | The Fourth Clover`,
    description:
      total > 0
        ? `${total} piece${total === 1 ? "" : "s"} tagged “${displayTag}”.`
        : `Stories and dispatches tagged “${displayTag}”.`,
  };
}

export default async function TagDetailPage({
  params,
}: {
  params: Promise<TagParams>;
}) {
  const { tag: tagParam } = await params;
  const { displayTag, posts, submissions } =
    await fetchTagPageContent(tagParam);
  const total = posts.length + submissions.length;

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        label="Tags"
        labelHref="/tags"
        title={displayTag}
        description={
          total > 0
            ? `${total} piece${total === 1 ? "" : "s"} under this tag.`
            : "Nothing published with this tag yet."
        }
      />

      {total === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Empty shelf"
            description="Try another tag, or browse the full index."
            action={
              <Link
                href="/tags"
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand transition-colors hover:text-foreground"
              >
                All tags
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {posts.length > 0 && (
            <section>
              <SectionLabel href="/journal">Journal</SectionLabel>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {posts.map((post) => (
                  <ArticleCard
                    key={post.id}
                    section="journal"
                    variant="standard"
                    title={post.title}
                    slug={post.slug}
                    excerpt={post.excerpt}
                    coverImage={post.cover_image || post.featured_image}
                    author={
                      post.author
                        ? {
                            username: post.author.username,
                            fullName: post.author.full_name,
                            avatarUrl: post.author.avatar_url,
                          }
                        : null
                    }
                    publishedAt={post.published_at}
                    readTime={post.read_time}
                    tags={post.tags}
                    format={post.format === "poetry" ? "poetry" : "prose"}
                    reactionCount={post.likes?.[0]?.count}
                    commentCount={post.comments?.[0]?.count}
                  />
                ))}
              </div>
            </section>
          )}

          {submissions.length > 0 && (
            <section>
              <SectionLabel href="/tech-weekly">Tech Weekly</SectionLabel>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {submissions.map((sub) => (
                  <ArticleCard
                    key={sub.id}
                    section="tech"
                    variant="standard"
                    title={sub.title}
                    slug={sub.slug}
                    excerpt={sub.summary}
                    coverImage={sub.cover_image}
                    author={
                      sub.author
                        ? {
                            username: sub.author.username,
                            fullName: sub.author.full_name,
                            avatarUrl: sub.author.avatar_url,
                            dept: sub.author.dept,
                            year: sub.author.year,
                            isCsi: true,
                          }
                        : null
                    }
                    publishedAt={sub.created_at}
                    readTime={sub.read_time}
                    tags={sub.tags}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
