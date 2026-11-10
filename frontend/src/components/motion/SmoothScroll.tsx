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

type LenisInstance = {
  scrollTo: (
    target: ScrollTarget,
    options?: {
      offset?: number;
      immediate?: boolean;
      force?: boolean;
      duration?: number;
      easing?: (t: number) => number;
    },
  ) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  raf: (time: number) => void;
  stop: () => void;
  start: () => void;
  destroy: () => void;
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
    __cloverLenis?: LenisInstance;
  }
}

/** Writer desks and account tools — Lenis fights text fields / dense tables. */
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
  "/auth",
];

/** Public reading path — native scroll feels immediate on long pieces. */
function isReadingRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/journal" || pathname.startsWith("/journal/")) return true;
  if (pathname.startsWith("/post/")) return true;
  if (pathname === "/tech-weekly" || pathname.startsWith("/tech-weekly/")) {
    return true;
  }
  return false;
}

function shouldDisableLenis(pathname: string | null): boolean {
  if (!pathname) return false;
  if (isReadingRoute(pathname)) return true;
  return LENIS_OFF_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function scheduleIdle(fn: () => void): () => void {
  if (typeof window === "undefined") return noop;
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(() => fn(), { timeout: 1200 });
    return () => window.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(fn, 200);
  return () => globalThis.clearTimeout(id);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisInstance | null>(null);
  const listenersRef = useRef(new Set<ScrollListener>());
  const lockCountRef = useRef(0);
  const reducedMotion = usePrefersReducedMotion();
  const pathname = usePathname();
  const toolsRoute = shouldDisableLenis(pathname);
  const enabled = !reducedMotion && !toolsRoute;

  useEffect(() => {
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

    let cancelled = false;
    let lenis: LenisInstance | null = null;
    let tick: ((time: number) => void) | null = null;
    let cleanupMotion: (() => void) | null = null;
    let cancelIdle = noop;

    if (enabled) {
      cancelIdle = scheduleIdle(() => {
        void (async () => {
          const [{ default: Lenis }, { gsap, ScrollTrigger }] =
            await Promise.all([import("lenis"), import("@/lib/gsap")]);
          if (cancelled) return;

          ScrollTrigger.config({ ignoreMobileResize: true });

          lenis = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 0.9,
          }) as unknown as LenisInstance;
          lenisRef.current = lenis;
          window.__cloverLenis = lenis;
          lenis.on("scroll", ScrollTrigger.update);

          tick = (time: number) => lenis?.raf(time * 1000);
          gsap.ticker.add(tick);
          gsap.ticker.lagSmoothing(0);

          if (lockCountRef.current > 0) lenis.stop();

          const refresh = () => ScrollTrigger.refresh();
          window.addEventListener("load", refresh);
          if (document.fonts) void document.fonts.ready.then(refresh);

          cleanupMotion = () => {
            window.removeEventListener("load", refresh);
            if (tick) gsap.ticker.remove(tick);
            lenis?.destroy();
            lenisRef.current = null;
            delete window.__cloverLenis;
          };
        })();
      });
    }

    return () => {
      cancelled = true;
      cancelIdle();
      window.removeEventListener("scroll", onScroll);
      cleanupMotion?.();
      if (!cleanupMotion) {
        lenis?.destroy();
        lenisRef.current = null;
        delete window.__cloverLenis;
      }
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
