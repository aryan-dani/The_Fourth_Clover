"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ReadingProgressProps = {
  /** CSS selector for the article body; defaults to document scroll. */
  targetSelector?: string;
  className?: string;
};

export function ReadingProgress({
  targetSelector,
  className,
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const target = targetSelector
        ? document.querySelector(targetSelector)
        : null;

      if (target instanceof HTMLElement) {
        const rect = target.getBoundingClientRect();
        const total = target.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        const next =
          total <= 0 ? (rect.bottom <= window.innerHeight ? 100 : 0) : (scrolled / total) * 100;
        setProgress(Math.min(100, Math.max(0, next)));
        return;
      }

      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      const next = total <= 0 ? 0 : (el.scrollTop / total) * 100;
      setProgress(Math.min(100, Math.max(0, next)));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetSelector]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-16 z-40 h-0.5 bg-transparent",
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label="Reading progress"
    >
      <div
        className="h-full origin-left bg-brand transition-[width] duration-editorial ease-editorial"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
