import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 py-20"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="text-3xl leading-none animate-pulse" aria-hidden>
        🍀
      </span>
      <div className="flex flex-col items-center gap-2">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          aria-hidden
        />
        <span className="sr-only">Loading page</span>
      </div>
    </div>
  );
}
