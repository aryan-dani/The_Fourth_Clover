"use client";

import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotionNow, useMediaQuery } from "@/lib/hooks";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import type { UserCapabilities } from "@/lib/roles";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/journal", label: "Journal" },
  { href: "/tech-weekly", label: "Tech Weekly" },
  { href: "/following", label: "Following", auth: true },
  { href: "/about", label: "About" },
] as const;

type ProfileSummary = {
  username: string;
  full_name: string | null;
} | null;

type Props = {
  open: boolean;
  onClose: () => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
  signedIn: boolean;
  profile: ProfileSummary;
  capabilities: UserCapabilities;
};

export function MobileMenu({
  open,
  onClose,
  toggleRef,
  signedIn,
  profile,
  capabilities,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const lockedRef = useRef(false);
  const { lock, unlock } = useSmoothScroll();
  const unlockRef = useRef(unlock);
  unlockRef.current = unlock;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const items = root.querySelectorAll("[data-menu-item]");
      const fades = root.querySelectorAll("[data-menu-fade]");

      gsap.set(root, { yPercent: -100, visibility: "hidden" });
      gsap.set(items, { yPercent: 115 });
      gsap.set(fades, { autoAlpha: 0, y: 20 });

      const releaseChrome = () => {
        const content = document.getElementById("content");
        if (content) content.inert = false;
        if (lockedRef.current) {
          lockedRef.current = false;
          unlockRef.current();
        }
      };

      const tl = gsap.timeline({
        paused: true,
        onReverseComplete: () => {
          gsap.set(root, { visibility: "hidden" });
          releaseChrome();
        },
      });
      tl.set(root, { visibility: "visible" })
        .to(root, { yPercent: 0, duration: 0.95, ease: "expo.inOut" })
        .to(
          items,
          { yPercent: 0, duration: 1.2, stagger: 0.08, ease: "expo.out" },
          "-=0.5",
        )
        .to(
          fades,
          { autoAlpha: 1, y: 0, duration: 1, stagger: 0.07, ease: "expo.out" },
          "-=0.9",
        );
      tlRef.current = tl;

      return () => {
        tl.kill();
        tlRef.current = null;
      };
    },
    { scope: rootRef },
  );

  useEffect(() => {
    const tl = tlRef.current;
    const root = rootRef.current;
    const content = document.getElementById("content");
    if (!tl || !root) return;

    if (open) {
      if (!lockedRef.current) {
        lockedRef.current = true;
        lock();
      }
      if (content) content.inert = true;
      gsap.set(root, { visibility: "visible" });
      if (prefersReducedMotionNow()) tl.progress(1);
      else tl.timeScale(1).play();
      root.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });
    } else if (prefersReducedMotionNow()) {
      tl.progress(0);
      gsap.set(root, { visibility: "hidden" });
      if (content) content.inert = false;
      if (lockedRef.current) {
        lockedRef.current = false;
        unlock();
      }
    } else {
      tl.timeScale(1.5).reverse();
    }
  }, [open, lock, unlock]);

  useEffect(() => {
    return () => {
      const content = document.getElementById("content");
      if (content) content.inert = false;
      if (lockedRef.current) {
        lockedRef.current = false;
        unlock();
      }
    };
  }, [unlock]);

  useEffect(() => {
    if (isDesktop && open) onClose();
  }, [isDesktop, open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const root = rootRef.current;
      const toggle = toggleRef.current;
      if (!root || !toggle) return;
      const ring = [
        ...Array.from(root.querySelectorAll<HTMLElement>("a[href], button")),
        toggle,
      ];
      const first = ring[0];
      const last = ring[ring.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, toggleRef]);

  const links = NAV.filter((l) => !("auth" in l && l.auth) || signedIn);

  return (
    <div
      id="mobile-menu"
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      data-lenis-prevent
      className="invisible fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto bg-[var(--ink)] px-[var(--gutter)] pb-10 pt-28 text-[var(--paper)] md:hidden"
    >
      <nav aria-label="Mobile">
        <ul>
          {links.map((item, i) => (
            <li key={item.href} className="overflow-hidden">
              <Link
                data-menu-item
                href={item.href}
                onClick={onClose}
                className="type-display flex items-start gap-4 py-[0.05em] text-[clamp(3.2rem,16vw,6rem)] leading-[0.95]"
              >
                <span className="type-label mt-[0.9em] w-6 shrink-0 text-[0.7rem] opacity-70">
                  0{i + 1}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-5" data-menu-fade>
        {signedIn ? (
          <div className="type-label flex flex-wrap gap-x-7 gap-y-3">
            {capabilities.canWriteJournal && (
              <Link href="/write" onClick={onClose} className="link-u">
                Write
              </Link>
            )}
            <Link href="/dashboard" onClick={onClose} className="link-u">
              Studio
            </Link>
            {profile?.username && (
              <Link
                href={`/profile/${profile.username}`}
                onClick={onClose}
                className="link-u"
              >
                Profile
              </Link>
            )}
            <Link href="/settings" onClick={onClose} className="link-u">
              Settings
            </Link>
            {capabilities.isAdmin && (
              <Link href="/admin" onClick={onClose} className="link-u">
                Admin
              </Link>
            )}
          </div>
        ) : (
          <Link
            href="/auth/signin"
            onClick={onClose}
            className="type-label link-u self-start"
          >
            Sign in
          </Link>
        )}
        <a
          href="mailto:legal@thefourthclover.com"
          className="link-u self-start text-[1.1rem] leading-tight"
        >
          legal@thefourthclover.com
        </a>
      </div>
    </div>
  );
}
