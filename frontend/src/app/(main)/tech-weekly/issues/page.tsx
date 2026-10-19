import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/editorial/EmptyState";
import { PageHeader } from "@/components/editorial/PageHeader";
import { listTechWeeks } from "@/features/data/discovery-queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tech Weekly Issues | The Fourth Clover",
  description: "Archive of CSI Tech Weekly cycles and their dispatches.",
};

function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

export default async function TechWeeklyIssuesPage() {
  const weeks = await listTechWeeks(52);

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        label="Tech Weekly"
        labelHref="/tech-weekly"
        title="Issues"
        description="Past and current weekly cycles from the CSI Tech desk."
      />

      <div className="mt-10">
        {weeks.length === 0 ? (
          <EmptyState
            title="No issues yet"
            description="When a Tech Weekly cycle opens, it will show up here."
          />
        ) : (
          <ul className="divide-y divide-hairline border-y border-hairline">
            {weeks.map((week) => (
              <li key={week.id}>
                <Link
                  href={`/tech-weekly/issues/${week.id}`}
                  className="group flex flex-col gap-1 py-5 transition-colors duration-editorial sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0 space-y-1">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-brand">
                      {week.title}
                    </h2>
                    {week.prompt && (
                      <p className="line-clamp-2 max-w-measure font-serif text-sm leading-relaxed text-muted-foreground">
                        {week.prompt}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    <span className="tabular-nums">{week.week_key}</span>
                    <span className="mx-2 text-hairline">·</span>
                    <span>{formatRange(week.starts_at, week.ends_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
