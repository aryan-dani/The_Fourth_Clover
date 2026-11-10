import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type HomeRevealProps = {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Stagger index for CSS animation-delay (0.05s steps). */
  delay?: number;
};

/**
 * Lightweight homepage entrance — CSS only, no GSAP.
 * Keeps the first paint visible; motion is a short rise after paint.
 */
export function HomeReveal({
  as = "div",
  className,
  style,
  children,
  delay = 0,
}: HomeRevealProps) {
  const Tag = as as ElementType;
  const delayMs = Math.round(delay * 1000);
  return (
    <Tag
      className={cn("home-reveal", className)}
      style={
        delayMs > 0
          ? { ...style, animationDelay: `${delayMs}ms` }
          : style
      }
    >
      {children}
    </Tag>
  );
}

export function HomeLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("home-reveal home-reveal--line", className)}
      aria-hidden="true"
    />
  );
}
