"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";

export type ScrollTarget = string | number | HTMLElement;

export type ScrollInfo = {
  y: number;
  direction: 1 | -1;
};

type ScrollListener = (info: ScrollInfo) => void;

type SmoothScrollContextValue = {
  scrollTo: (
    target: ScrollTarget,
    options?: { immediate?: boolean; offset?: number },
  ) => void;
  lock: () => void;
  unlock: () => void;
  subscribe: (listener: ScrollListener) => () => void;
  enabled: boolean;
};

const noop = () => {};
const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  scrollTo: noop,
  lock: noop,
  unlock: noop,
  subscribe: () => noop,
  enabled: false,
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

declare global {
  interface Window {
    __cloverLenis?: Lenis;
  }
}

/** Routes where Lenis fights text fields / dense tables. */
const LENIS_OFF_PREFIXES = [
  "/write",
  "/dashboard",
  "/admin",
  "/settings",
  "/notifications",
  "/verify-csi",
  "/tech-weekly/write",
  "/tech-weekly/review",
  "/csi/write",
  "/csi/review",
];

function shouldDisableLenis(pathname: string | null): boolean {
  if (!pathname) return false;
  return LENIS_OFF_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const listenersRef = useRef(new Set<ScrollListener>());
  const lockCountRef = useRef(0);
  const reducedMotion = usePrefersReducedMotion();
  const pathname = usePathname();
  const toolsRoute = shouldDisableLenis(pathname);
  const enabled = !reducedMotion && !toolsRoute;

  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });

    let lastY = window.scrollY;
    let direction: 1 | -1 = 1;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 2) {
        direction = y > lastY ? 1 : -1;
        lastY = y;
      }
      listenersRef.current.forEach((fn) => fn({ y, direction }));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    if (enabled) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
      });
      lenisRef.current = lenis;
      window.__cloverLenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);

      tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      if (lockCountRef.current > 0) lenis.stop();
    }

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    if (document.fonts) document.fonts.ready.then(refresh);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("load", refresh);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      lenisRef.current = null;
      delete window.__cloverLenis;
    };
  }, [enabled]);

  const scrollTo = useCallback<SmoothScrollContextValue["scrollTo"]>(
    (target, options) => {
      const immediate = options?.immediate ?? false;
      const offset = options?.offset ?? 0;
      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(target, {
          offset,
          immediate,
          force: true,
          duration: immediate ? 0 : 1.6,
          easing: (t: number) => 1 - Math.pow(1 - t, 4),
        });
        if (immediate) ScrollTrigger.update();
        return;
      }
      if (typeof target === "number") {
        window.scrollTo({ top: target + offset, behavior: "auto" });
      } else {
        const el =
          typeof target === "string"
            ? document.querySelector<HTMLElement>(target)
            : target;
        el?.scrollIntoView({ behavior: "auto", block: "start" });
      }
    },
    [],
  );

  const lock = useCallback(() => {
    lockCountRef.current += 1;
    if (lockCountRef.current === 1) {
      lenisRef.current?.stop();
      document.documentElement.style.overflow = "hidden";
    }
  }, []);

  const unlock = useCallback(() => {
    lockCountRef.current = Math.max(0, lockCountRef.current - 1);
    if (lockCountRef.current === 0) {
      lenisRef.current?.start();
      document.documentElement.style.overflow = "";
    }
  }, []);

  const subscribe = useCallback((listener: ScrollListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo(
    () => ({ scrollTo, lock, unlock, subscribe, enabled }),
    [scrollTo, lock, unlock, subscribe, enabled],
  );

  return (
    <SmoothScrollContext.Provider value={value}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
