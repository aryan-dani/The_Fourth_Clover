"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";

export default function CsiReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CSI review error:", error);
  }, [error]);

  return (
    <PageShell className="flex items-center justify-center px-4 py-16">
      <div className="max-w-md space-y-6 text-center">
        <div className="bg-destructive/10 text-destructive mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold">
            Review Queue Unavailable
          </h1>
          <p className="text-muted-foreground text-sm">
            We encountered an error loading the CSI review queue. Please try again.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/csi">
              <ArrowLeft className="h-4 w-4" />
              Back to CSI
            </Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
