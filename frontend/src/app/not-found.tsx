import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CloverMark } from "@/components/layout/CloverMark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-background">
      <span className="circle-logo h-12 w-12 text-lg">
        <CloverMark />
      </span>
      <div className="max-w-md space-y-2 text-center">
        <p className="meta-label">404</p>
        <h1 className="font-display text-display-sm text-foreground">
          Page not found
        </h1>
        <p className="font-serif text-muted-foreground">
          This dispatch or journal piece does not exist — or it has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline" className="rounded-md">
          <Link href="/journal">Browse Journal</Link>
        </Button>
        <Button asChild className="rounded-md">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}
