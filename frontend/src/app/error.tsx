"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CloverMark } from "@/components/layout/CloverMark";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-background">
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card text-foreground">
        <CloverMark className="h-6 w-6" />
      </div>
      <div className="text-center max-w-md space-y-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          An unexpected error occurred
        </h1>
        <p className="text-muted-foreground text-sm">
          We encountered an interruption while rendering this view. Please retry
          or return to the masthead.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-md"
          onClick={() => reset()}
        >
          Retry
        </Button>
        <Button type="button" asChild className="rounded-md">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
