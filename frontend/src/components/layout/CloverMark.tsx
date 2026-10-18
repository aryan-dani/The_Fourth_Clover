import * as React from "react";
import { cn } from "@/lib/utils";

type CloverMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

/**
 * The Fourth Clover signature four-leaf clover mark.
 */
export function CloverMark({ className, size = "md" }: CloverMarkProps) {
  const sizeClass =
    size === "sm"
      ? "text-base"
      : size === "lg"
        ? "text-2xl"
        : "text-lg";

  return (
    <span
      role="img"
      aria-label="Four leaf clover"
      className={cn(
        "inline-flex items-center justify-center select-none leading-none",
        sizeClass,
        className
      )}
    >
      🍀
    </span>
  );
}
