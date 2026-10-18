export default function TechWeeklyLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      <div className="space-y-4 border-b border-border/60 pb-8">
        <div className="h-4 w-40 rounded-full bg-muted" />
        <div className="h-10 w-80 max-w-full rounded-xl bg-muted" />
        <div className="h-5 w-2/3 rounded-lg bg-muted/70" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl border border-border/60 bg-card/60 p-6"
            />
          ))}
        </div>
        <div className="lg:col-span-4">
          <div className="h-80 rounded-2xl border border-border/60 bg-card/60 p-6" />
        </div>
      </div>
    </div>
  );
}
