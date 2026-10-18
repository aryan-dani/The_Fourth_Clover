export default function TechWeeklyReviewLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
      <div className="h-24 w-full rounded-2xl border border-border/60 bg-card/70" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 rounded-2xl border border-border/60 bg-card/70"
          />
        ))}
      </div>
    </div>
  );
}
