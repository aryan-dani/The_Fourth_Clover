"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap } from "@/lib/gsap";
import { whenIntroRevealing } from "@/lib/intro";
import { prefersReducedMotionNow, useMotionEffect } from "@/lib/hooks";

const LEAVES = [
  // right
  "M32 34c0-6 4.5-11 10-11s10 5 10 11-4.5 10-10 10c-2.2 0-4.2-.7-5.9-1.9",
  // left
  "M32 34c0-6-4.5-11-10-11S12 28 12 34s4.5 10 10 10c2.2 0 4.2-.7 5.9-1.9",
  // top
  "M32 34c-6 0-11-4.5-11-10S26 14 32 14s11 4.5 11 10-5 10-11 10",
  // bottom
  "M32 34c6 0 11 4.5 11 10S38 54 32 54 21 49.5 21 44s5-10 11-10",
] as const;

const STEM = "M32 34v18M30 52h4";

type HeroCloverProps = {
  className?: string;
};

/**
 * Large stroked clover for the home hero — stroke-draw on intro, then holds still.
 */
export function HeroClover({ className }: HeroCloverProps) {
  const leafRefs = useRef<(SVGPathElement | null)[]>([]);
  const stemRef = useRef<SVGPathElement | null>(null);

  useMotionEffect(() => {
    const leaves = leafRefs.current.filter(Boolean) as SVGPathElement[];
    const stem = stemRef.current;
    const paths = [...leaves, ...(stem ? [stem] : [])];
    if (paths.length === 0) return;

    if (prefersReducedMotionNow()) {
      paths.forEach((p) => {
        p.style.strokeDasharray = "none";
        p.style.strokeDashoffset = "0";
      });
      return;
    }

    paths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, {
        strokeDasharray: len,
        strokeDashoffset: len,
      });
    });

    const tl = gsap.timeline({ paused: true });
    leaves.forEach((leaf, i) => {
      tl.to(
        leaf,
        {
          strokeDashoffset: 0,
          duration: 0.55,
          ease: "power2.out",
        },
        i === 0 ? 0 : "-=0.28",
      );
    });
    if (stem) {
      tl.to(
        stem,
        {
          strokeDashoffset: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        "-=0.15",
      );
    }

    const disarm = whenIntroRevealing(() => {
      tl.play();
    });

    return () => {
      disarm();
      tl.kill();
    };
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none select-none text-[var(--brand-color)]",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="h-full w-full"
        overflow="visible"
      >
        {LEAVES.map((d, i) => (
          <path
            key={i}
            ref={(el) => {
              leafRefs.current[i] = el;
            }}
            d={d}
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        <path
          ref={stemRef}
          d={STEM}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
