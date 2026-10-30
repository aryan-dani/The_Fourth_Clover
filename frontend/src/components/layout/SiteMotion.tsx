"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Intro } from "@/components/motion/Intro";
import { PageEnter } from "@/components/motion/Reveal";
import { prefersReducedMotionNow } from "@/lib/hooks";

/** Home intro overlay only — does not remount chrome. */
export function SiteMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isHome = pathname === "/";

  return (
    <>
      {isHome && <Intro />}
      {children}
    </>
  );
}

/**
 * Soft route body enter. Also fades the current page slightly when an
 * in-app link is clicked so the swap feels less abrupt.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.nav = "idle";
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (prefersReducedMotionNow()) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      document.documentElement.dataset.nav = "leaving";
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div ref={shellRef} className="page-transition-shell">
      <PageEnter key={pathname}>{children}</PageEnter>
    </div>
  );
}
