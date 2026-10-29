"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const { subscribe } = useSmoothScroll();
  const [menuOpen, setMenuOpen] = useState(false);
  const [raised, setRaised] = useState(false);
  const [hidden, setHidden] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return subscribe(({ y, direction }) => {
      setRaised(y > 16);
      setHidden(y > 140 && direction === 1);
    });
  }, [subscribe]);

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
          className={cn(
            "nav-dock pointer-events-auto mx-auto flex h-14 max-w-content items-center gap-2 px-2 sm:h-[3.75rem] sm:gap-3 sm:px-3",
            tucked
              ? "-translate-y-[140%] opacity-0"
              : "translate-y-0 opacity-100",
          )}
        >
          <Link
            href="/"
            aria-label="The Fourth Clover, home"
            className="group flex items-center gap-2.5"
            onClick={() => setMenuOpen(false)}
          >
            <CloverMark size="md" className="text-[var(--brand-color)] group-hover:opacity-90" />
            <span className="type-display hidden text-[0.95rem] tracking-tight sm:inline">
              The Fourth{" "}
              <span className="type-script text-[1.35em] normal-case tracking-normal text-[var(--brand-color)]">
                Clover
              </span>
            </span>
          </Link>

          <HeaderNav
            signedIn={signedIn}
            variant="bar"
            className="hidden flex-1 justify-center md:flex"
          />

          <div className="hidden items-center gap-1 md:flex">
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
            className="type-label -mr-1 px-1 py-2 md:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
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
