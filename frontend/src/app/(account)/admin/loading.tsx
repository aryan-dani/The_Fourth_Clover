export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full bg-muted" />
          <div className="h-9 w-72 rounded-xl bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-36 rounded-xl bg-muted" />
          <div className="h-9 w-36 rounded-xl bg-muted" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border/60 bg-card/70 p-5"
          />
        ))}
      </div>
      <div className="h-12 w-full rounded-2xl bg-muted/60" />
      <div className="h-96 w-full rounded-2xl border border-border/60 bg-card/70" />
    </div>
  );
}
