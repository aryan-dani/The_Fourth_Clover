export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-content space-y-8 px-4 py-16 sm:px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-10 w-2/3 max-w-xl animate-pulse rounded bg-muted" />
        <div className="h-4 w-full max-w-lg animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 border border-hairline p-4">
            <div className="aspect-[16/10] animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
