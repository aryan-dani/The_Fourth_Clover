import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { EmptyState } from "@/components/editorial/EmptyState";
import { PageHeader } from "@/components/editorial/PageHeader";
import { fetchTechWeekById } from "@/features/data/discovery-queries";

export const revalidate = 60;

type WeekParams = { weekId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<WeekParams>;
}): Promise<Metadata> {
  const { weekId } = await params;
  const { week } = await fetchTechWeekById(weekId);
  if (!week) {
    return { title: "Issue not found | Tech Weekly" };
  }
  return {
    title: `${week.title} | Tech Weekly`,
    description:
      week.prompt ||
      `Submissions from CSI Tech Weekly ${week.week_key}.`,
  };
}

export default async function TechWeeklyIssueDetailPage({
  params,
}: {
  params: Promise<WeekParams>;
}) {
  const { weekId } = await params;
  const { week, submissions } = await fetchTechWeekById(weekId);
  if (!week) notFound();

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        label="Issues"
        labelHref="/tech-weekly/issues"
        title={week.title}
        description={
          week.prompt ||
          `Week ${week.week_key}${
            week.week_number != null ? ` · #${week.week_number}` : ""
          }`
        }
      />

      <div className="mt-10">
        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions"
            description="This cycle has no public dispatches yet."
            action={
              <Link
                href="/tech-weekly/issues"
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand transition-colors hover:text-foreground"
              >
                All issues
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
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
        )}
      </div>
    </div>
  );
}
