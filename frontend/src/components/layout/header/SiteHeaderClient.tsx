"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { whenIntroRevealing } from "@/lib/intro";
import { prefersReducedMotionNow, useMotionEffect } from "@/lib/hooks";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import { CloverMark } from "@/components/layout/CloverMark";
import { HeaderNav } from "@/components/layout/header/HeaderNav";
import { HeaderActions } from "@/components/layout/header/HeaderActions";
import { MobileMenu } from "@/components/layout/header/MobileMenu";
import type { UserCapabilities } from "@/lib/roles";
import { cn } from "@/lib/utils";

const IDLE_HIDE_MS = 2000;
const TOP_SHOW_Y = 48;

type ProfileSummary = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "unverified" | "member" | "tech_member" | "tech_head" | "super_admin";
  is_admin: boolean;
  is_suspended: boolean;
  csi_id: number | null;
} | null;

export function SiteHeaderClient({
  signedIn,
  profile,
  capabilities,
}: {
  signedIn: boolean;
  profile: ProfileSummary;
  capabilities: UserCapabilities;
}) {
  const pathname = usePathname();
  const { subscribe } = useSmoothScroll();
  const [menuOpen, setMenuOpen] = useState(false);
  const [raised, setRaised] = useState(false);
  const [hidden, setHidden] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const scrollYRef = useRef(0);

  useEffect(() => {
    const clearIdle = () => {
      if (idleTimerRef.current != null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const armIdleHide = () => {
      clearIdle();
      if (scrollYRef.current <= TOP_SHOW_Y) return;
      idleTimerRef.current = window.setTimeout(() => {
        setHidden(true);
      }, IDLE_HIDE_MS);
    };

    const unsub = subscribe(({ y }) => {
      scrollYRef.current = y;
      setRaised(y > 16);
      // Any scroll activity brings the dock back; hide only after stillness.
      setHidden(false);
      armIdleHide();
    });

    return () => {
      clearIdle();
      unsub();
    };
  }, [subscribe]);

  // Fresh route: show dock and re-arm idle if already mid-page.
  useEffect(() => {
    setHidden(false);
    setMenuOpen(false);
    if (idleTimerRef.current != null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (scrollYRef.current > TOP_SHOW_Y) {
      idleTimerRef.current = window.setTimeout(() => {
        setHidden(true);
      }, IDLE_HIDE_MS);
    }
    return () => {
      if (idleTimerRef.current != null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [pathname]);

  useMotionEffect(() => {
    const el = innerRef.current;
    if (!el || prefersReducedMotionNow()) {
      if (el) el.dataset.revealed = "true";
      return;
    }
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: -18 },
      {
        opacity: 1,
        y: 0,
        duration: 1.3,
        delay: 0.35,
        paused: true,
        onComplete: () => {
          gsap.set(el, { clearProps: "transform,opacity" });
          el.dataset.revealed = "true";
        },
      },
    );
    const disarm = whenIntroRevealing(() => tween.play());
    return () => {
      disarm();
      tween.kill();
    };
  }, []);

  const tucked = hidden && !menuOpen;

  return (
    <>
      <header
        id="site-header"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
      >
        <div
          ref={innerRef}
          data-reveal="header"
          data-raised={raised ? "true" : "false"}
          data-tucked={tucked ? "true" : "false"}
          className={cn(
            "nav-dock pointer-events-auto mx-auto grid h-[3.4rem] max-w-content grid-cols-[auto_1fr_auto] items-center gap-4 px-3.5 sm:h-[3.65rem] sm:gap-6 sm:px-5",
            tucked && "pointer-events-none",
          )}
        >
          <Link
            href="/"
            aria-label="The Fourth Clover, home"
            className="group flex min-w-0 shrink-0 items-center gap-2.5"
            onClick={() => setMenuOpen(false)}
          >
            <CloverMark
              size="md"
              className="text-[var(--brand-color)] transition-opacity group-hover:opacity-80"
            />
            <span className="hidden min-w-0 items-baseline gap-1.5 sm:inline-flex">
              <span className="type-display text-[0.92rem] leading-none tracking-[-0.02em] text-foreground">
                The Fourth
              </span>
              <span className="type-script text-[1.45rem] leading-none text-[var(--brand-color)]">
                Clover
              </span>
            </span>
          </Link>

          <HeaderNav
            signedIn={signedIn}
            variant="bar"
            className="hidden justify-self-center md:inline-flex"
          />

          <div className="justify-self-end">
            <div className="hidden md:block">
              <HeaderActions
                signedIn={signedIn}
                profile={profile}
                capabilities={capabilities}
                variant="bar"
              />
            </div>
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="type-label rounded-md px-3 py-2 text-foreground md:hidden"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        toggleRef={toggleRef}
        signedIn={signedIn}
        profile={profile}
        capabilities={capabilities}
      />
    </>
  );
}
