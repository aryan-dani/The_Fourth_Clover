import * as React from "react";
import { cn } from "@/lib/utils";

type CloverMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** When true, path is prepared for stroke-dashoffset draw animation */
  drawReady?: boolean;
  pathRef?: React.Ref<SVGPathElement>;
};

const SIZE = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
  xl: "h-16 w-16",
} as const;

/**
 * Four-leaf clover as a stroked SVG (replaces the emoji mark).
 */
export function CloverMark({
  className,
  size = "md",
  drawReady = false,
  pathRef,
}: CloverMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden={!drawReady}
      role={drawReady ? "img" : undefined}
      aria-label={drawReady ? "Four leaf clover" : undefined}
      className={cn(SIZE[size], "shrink-0", className)}
    >
      <path
        ref={pathRef}
        d="M32 34c0-6 4.5-11 10-11s10 5 10 11-4.5 10-10 10c-2.2 0-4.2-.7-5.9-1.9M32 34c0-6-4.5-11-10-11S12 28 12 34s4.5 10 10 10c2.2 0 4.2-.7 5.9-1.9M32 34c-6 0-11-4.5-11-10S26 14 32 14s11 4.5 11 10-5 10-11 10c0 0 0 0 0 0M32 34c6 0 11 4.5 11 10S38 54 32 54 21 49.5 21 44s5-10 11-10M32 34v18M30 52h4"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={
          drawReady
            ? {
                strokeDasharray: 400,
                strokeDashoffset: 400,
              }
            : undefined
        }
      />
    </svg>
  );
}
