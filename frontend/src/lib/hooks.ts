"use client";

import {
  useEffect,
  useRef,
  type DependencyList,
  type EffectCallback,
} from "react";
import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function prefersReducedMotionNow(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Run motion setup after hydration + streaming swaps ($RC/$RS).
 * useLayoutEffect (via useGSAP) races React Flight resume and can trigger
 * React #418 / parentNode null errors.
 */
export function useMotionEffect(effect: EffectCallback, deps: DependencyList) {
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    let cancelled = false;
    let cleanup: void | (() => void);
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        if (cancelled) return;
        cleanup = effectRef.current();
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional deps from caller
  }, deps);
}
