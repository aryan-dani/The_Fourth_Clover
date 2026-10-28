"use client";

import { useEffect } from "react";

const COLORS = {
  paper: "#F2ECE0",
  clover: "#2E7D57",
  ink: "#17211A",
} as const;

type Theme = keyof typeof COLORS;

function isTheme(value: string | undefined): value is Theme {
  return value === "paper" || value === "clover" || value === "ink";
}

/**
 * Cross-fades page bg/fg as chapters pass the viewport midpoint.
 * Sections opt in with data-theme-section="paper|clover|ink".
 */
export function SectionTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    const sections = document.querySelectorAll<HTMLElement>(
      "[data-theme-section]",
    );

    let current: Theme | null = null;

    const apply = (theme: Theme) => {
      if (theme === current) return;
      current = theme;
      if (theme === "paper") delete root.dataset.theme;
      else root.dataset.theme = theme;
      meta?.setAttribute("content", COLORS[theme]);
    };

    const pick = () => {
      // Keep paper at the top of the page even when the hero is shorter than
      // half the viewport (midpoint would otherwise land in the next chapter).
      if (window.scrollY < 96) {
        apply("paper");
        return;
      }
      const mid = window.innerHeight * 0.5;
      let next: Theme = "paper";
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= mid && rect.bottom > mid) {
          const theme = section.dataset.themeSection;
          if (isTheme(theme)) next = theme;
        }
      });
      apply(next);
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        pick();
      });
    };

    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.__cloverLenis?.on("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.__cloverLenis?.off("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
      apply("paper");
    };
  }, []);

  return null;
}
