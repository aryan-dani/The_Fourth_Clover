"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
      <p className="text-4xl" aria-hidden>
        🍀
      </p>
      <div className="text-center max-w-md space-y-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-sm">
          A part of the app crashed. You can try again or return home.
        </p>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
