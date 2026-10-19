"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LoadMoreProps = {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export function LoadMore({
  onClick,
  loading = false,
  disabled = false,
  children = "Load more",
  className,
}: LoadMoreProps) {
  return (
    <div className={cn("flex justify-center pt-2", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={disabled || loading}
        className="min-w-[10rem] border-hairline"
        aria-busy={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </>
        ) : (
          children
        )}
      </Button>
    </div>
  );
}
