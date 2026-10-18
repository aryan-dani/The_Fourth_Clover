"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CloverMark } from "@/components/layout/CloverMark";

export default function CsiPostError({
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
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 bg-background">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-primary">
        <CloverMark className="h-5 w-5" />
      </div>
      <div className="text-center max-w-md space-y-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Unable to load article
        </h1>
        <p className="text-muted-foreground text-sm">
          Something went wrong while loading this CSI article. You can try again
          or return to the CSI Tech Weekly feed.
        </p>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" size="sm" asChild>
          <Link href="/tech-weekly">Back to CSI Tech Weekly</Link>
        </Button>
      </div>
    </div>
  );
}
