import { CloverMark } from "@/components/layout/CloverMark";

export default function Loading() {
  return (
    <div
      className="flex min-h-[55vh] w-full flex-col items-center justify-center gap-3 py-20"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground animate-pulse">
        <CloverMark className="h-5 w-5" />
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Loading Dispatch...
      </span>
    </div>
  );
}
