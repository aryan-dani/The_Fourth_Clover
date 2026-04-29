import { cn } from "@/lib/utils";

type PageBackdropProps = {
  variant?: "hero" | "subtle";
  className?: string;
};

/** Optional mesh / vignette for marketing & home — calmer app surfaces skip this */
export function PageBackdrop({ variant = "subtle", className }: PageBackdropProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        variant === "hero" &&
          "bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,hsl(var(--primary)/0.11),transparent_52%),radial-gradient(ellipse_55%_40%_at_100%_108%,hsl(138_38%_42%/0.07),transparent_42%)]",
        variant === "subtle" &&
          "opacity-90 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,hsl(var(--primary)/0.06),transparent_48%)]",
        className
      )}
      aria-hidden
    />
  );
}
