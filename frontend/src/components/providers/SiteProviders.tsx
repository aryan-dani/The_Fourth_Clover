"use client";

import { useEffect, type ReactNode } from "react";
import { SmoothScrollProvider } from "@/components/motion/SmoothScroll";
import { usePrefersReducedMotion } from "@/lib/hooks";

declare global {
  interface Window {
    __cloverReady?: boolean;
  }
}

export function SiteProviders({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    window.__cloverReady = true;
  }, []);

  useEffect(() => {
    if (!reducedMotion) return;
    const root = document.documentElement;
    root.classList.remove("js-motion");
    if (root.dataset.intro !== "done") root.dataset.intro = "done";
  }, [reducedMotion]);

  return <SmoothScrollProvider>{children}</SmoothScrollProvider>;
}
