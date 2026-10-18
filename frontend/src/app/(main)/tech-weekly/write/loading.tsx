export default function TechWeeklyWriteLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      <div className="h-12 w-full rounded-2xl border border-border/60 bg-card/70" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 h-[600px] rounded-2xl border border-border/60 bg-card/70" />
        <div className="lg:col-span-4 space-y-4">
          <div className="h-44 rounded-2xl border border-border/60 bg-card/70" />
          <div className="h-56 rounded-2xl border border-border/60 bg-card/70" />
        </div>
      </div>
    </div>
  );
}
