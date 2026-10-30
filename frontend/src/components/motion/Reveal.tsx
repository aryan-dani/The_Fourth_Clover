"use client";

import {
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { gsap, ScrollTrigger, MOTION } from "@/lib/gsap";
import { whenIntroRevealing } from "@/lib/intro";
import { prefersReducedMotionNow, useMotionEffect } from "@/lib/hooks";

export type Trigger = "scroll" | "intro";

function arm(
  el: Element,
  trigger: Trigger,
  start: string,
  play: () => void,
): () => void {
  if (trigger === "intro") return whenIntroRevealing(play);
  const st = ScrollTrigger.create({
    trigger: el,
    start,
    once: true,
    onEnter: play,
  });
  requestAnimationFrame(() => {
    const top = (el as HTMLElement).getBoundingClientRect().top;
    if (top < window.innerHeight * 0.92) play();
  });
  return () => st.kill();
}

function markRevealed(el: Element) {
  (el as HTMLElement).dataset.revealed = "true";
}

type CommonProps = {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  delay?: number;
  trigger?: Trigger;
  start?: string;
};

type RevealTextProps = CommonProps & {
  /** Kept for API compat — animation no longer rewrites the DOM. */
  by?: "lines" | "words" | "chars";
  duration?: number;
  stagger?: number;
};

/**
 * Text reveal without SplitText. SplitText rewrote nodes during/after hydrate
 * and caused React #418 (HTML) + Flight $RS parentNode errors.
 */
export function RevealText({
  as = "div",
  className,
  style,
  children,
  delay = 0,
  duration = MOTION.display,
  trigger = "scroll",
  start = "top 88%",
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as ElementType;

  useMotionEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotionNow()) {
      if (el) markRevealed(el);
      return;
    }

    const tween = gsap.fromTo(
      el,
      { yPercent: 18, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration,
        delay,
        ease: "expo.out",
        paused: true,
        onComplete: () => {
          gsap.set(el, { clearProps: "transform,opacity" });
          markRevealed(el);
        },
      },
    );
    const disarm = arm(el, trigger, start, () => tween.play());
    return () => {
      disarm();
      tween.kill();
    };
  }, [delay, duration, trigger, start]);

  return (
    <Tag ref={ref} data-reveal="text" className={className} style={style}>
      {children}
    </Tag>
  );
}

export function ScriptWipe({
  as = "span",
  className,
  style,
  children,
  delay = 0,
  trigger = "scroll",
  start = "top 92%",
}: CommonProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as ElementType;

  useMotionEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotionNow()) {
      if (el) markRevealed(el);
      return;
    }

    const from = "inset(-45% 101% -45% -35%)";
    const to = "inset(-45% -35% -45% -35%)";
    const tween = gsap.fromTo(
      el,
      { clipPath: from },
      {
        clipPath: to,
        duration: 1.9,
        delay,
        ease: "power2.inOut",
        paused: true,
        onComplete: () => {
          gsap.set(el, { clearProps: "clipPath" });
          markRevealed(el);
        },
      },
    );
    gsap.set(el, { opacity: 1 });
    const disarm = arm(el, trigger, start, () => tween.play());
    return () => {
      disarm();
      tween.kill();
    };
  }, [delay, trigger, start]);

  return (
    <Tag ref={ref} data-reveal="script" className={className} style={style}>
      {children}
    </Tag>
  );
}

type RevealProps = CommonProps & {
  y?: number;
  duration?: number;
};

export function Reveal({
  as = "div",
  className,
  style,
  children,
  delay = 0,
  y = 30,
  duration = 1.4,
  trigger = "scroll",
  start = "top 90%",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as ElementType;

  useMotionEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotionNow()) {
      if (el) markRevealed(el);
      return;
    }
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        paused: true,
        onComplete: () => {
          gsap.set(el, { clearProps: "transform,opacity" });
          markRevealed(el);
        },
      },
    );
    const disarm = arm(el, trigger, start, () => tween.play());
    return () => {
      disarm();
      tween.kill();
    };
  }, [delay, y, duration, trigger, start]);

  return (
    <Tag ref={ref} data-reveal="fade" className={className} style={style}>
      {children}
    </Tag>
  );
}

export function DrawLine({
  className = "hairline-rule",
  delay = 0,
  trigger = "scroll",
  start = "top 95%",
}: Omit<CommonProps, "as" | "children" | "style">) {
  const ref = useRef<HTMLDivElement>(null);

  useMotionEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotionNow()) {
      if (el) markRevealed(el);
      return;
    }
    const tween = gsap.fromTo(
      el,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.8,
        delay,
        paused: true,
        onComplete: () => {
          gsap.set(el, { clearProps: "transform" });
          markRevealed(el);
        },
      },
    );
    gsap.set(el, { opacity: 1 });
    const disarm = arm(el, trigger, start, () => tween.play());
    return () => {
      disarm();
      tween.kill();
    };
  }, [delay, trigger, start]);

  return (
    <div
      ref={ref}
      data-reveal="line"
      className={className}
      aria-hidden="true"
    />
  );
}

/** Soft page enter — remount with a key on route change for navigation fades. */
export function PageEnter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useMotionEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotionNow()) {
      if (el) el.dataset.revealed = "true";
      return;
    }
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "expo.out",
        onComplete: () => {
          gsap.set(el, { clearProps: "transform,opacity" });
          el.dataset.revealed = "true";
        },
      },
    );
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div ref={ref} data-reveal="fade" className={className}>
      {children}
    </div>
  );
}
