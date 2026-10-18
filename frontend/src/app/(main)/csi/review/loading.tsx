import { PageShell } from "@/components/layout/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function CsiReviewLoading() {
  return (
    <PageShell className="py-8">
      <div className="container mx-auto max-w-5xl space-y-6 px-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
