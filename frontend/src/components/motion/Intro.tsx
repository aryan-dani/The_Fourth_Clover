"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { setIntroState, fontsReady } from "@/lib/intro";
import { prefersReducedMotionNow, useMotionEffect } from "@/lib/hooks";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import { CloverMark } from "@/components/layout/CloverMark";

let runToken = 0;

/**
 * Home-only intro: stroke the clover, then lift “The Fourth Clover”.
 * Once per session; skipped with reduced motion.
 */
export function Intro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const { lock, unlock } = useSmoothScroll();

  useMotionEffect(() => {
    const root = rootRef.current;
    const path = pathRef.current;
    const title = titleRef.current;
    if (!root || !path || !title) return;
    if (document.documentElement.dataset.intro !== "pending") return;
    if (prefersReducedMotionNow()) {
      setIntroState("done");
      return;
    }

    const token = ++runToken;
    let locked = true;
    lock();

    const finish = () => {
      setIntroState("done");
      if (locked) {
        locked = false;
        unlock();
      }
    };

    const length = path.getTotalLength();
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length,
      visibility: "visible",
    });
    gsap.set(title, { y: 28, opacity: 0 });

    const tl = gsap.timeline({ paused: true, onComplete: finish });
    tl.to(path, {
      strokeDashoffset: 0,
      duration: 1.15,
      ease: "power2.inOut",
    });
    tl.to(
      title,
      { y: 0, opacity: 1, duration: 0.9, ease: "expo.out" },
      "-=0.35",
    );
    tl.call(() => setIntroState("revealing"), undefined, "+=0.15");
    tl.to(
      root,
      {
        y: () => -window.innerHeight * 1.15,
        duration: 0.95,
        ease: "expo.inOut",
      },
      "+=0.05",
    );

    fontsReady().then(() => {
      if (token !== runToken) return;
      tl.play();
    });

    const skip = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Escape") return;
      e.preventDefault();
      window.removeEventListener("keydown", skip);
      tl.timeScale(5);
    };
    window.addEventListener("keydown", skip);

    return () => {
      window.removeEventListener("keydown", skip);
      tl.kill();
      if (locked) {
        locked = false;
        unlock();
      }
      window.setTimeout(() => {
        if (
          token === runToken &&
          document.documentElement.dataset.intro !== "done"
        ) {
          setIntroState("done");
        }
      }, 60);
    };
  }, [lock, unlock]);

  return (
    <div ref={rootRef} className="intro" aria-hidden="true">
      <div className="flex flex-col items-center gap-8">
        <CloverMark size="xl" drawReady pathRef={pathRef} className="h-20 w-20" />
        <p
          ref={titleRef}
          className="type-display text-center text-[clamp(1.6rem,5vw,2.6rem)] tracking-tight"
        >
          The Fourth{" "}
          <span className="type-script text-[1.15em] normal-case tracking-normal">
            Clover
          </span>
        </p>
      </div>
    </div>
  );
}
