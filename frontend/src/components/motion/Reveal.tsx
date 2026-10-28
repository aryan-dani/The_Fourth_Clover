"use client";

import {
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, MOTION } from "@/lib/gsap";
import { fontsReady, whenIntroRevealing } from "@/lib/intro";
import { prefersReducedMotionNow } from "@/lib/hooks";

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
  // Above-the-fold elements can miss onEnter if ScrollTrigger arms after layout.
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
  by?: "lines" | "words" | "chars";
  duration?: number;
  stagger?: number;
};

export function RevealText({
  as = "div",
  className,
  style,
  children,
  by = "lines",
  delay = 0,
  duration = MOTION.display,
  stagger,
  trigger = "scroll",
  start = "top 88%",
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as ElementType;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotionNow()) return;

      let disposed = false;
      let fired = false;
      let disarm: (() => void) | undefined;
      let split: SplitText | undefined;
      let activeTween: gsap.core.Tween | undefined;

      fontsReady().then(() => {
        if (disposed) return;
        try {
          split = SplitText.create(el, {
            type:
              by === "chars"
                ? "lines,words,chars"
                : by === "words"
                  ? "lines,words"
                  : "lines",
            mask: "lines",
            autoSplit: true,
            linesClass: "split-line",
            aria: "none",
            onSplit(self) {
              activeTween?.kill();
              activeTween = undefined;
              disarm?.();
              disarm = undefined;
              const targets =
                by === "chars"
                  ? self.chars
                  : by === "words"
                    ? self.words
                    : self.lines;
              const tween = gsap.from(targets, {
                yPercent: 112,
                duration,
                delay,
                stagger:
                  stagger ?? (by === "chars" ? 0.028 : MOTION.stagger),
                paused: !fired,
                onComplete: () => markRevealed(el),
              });
              activeTween = tween;
              gsap.set(el, { opacity: 1 });
              if (!fired) {
                disarm = arm(el, trigger, start, () => {
                  fired = true;
                  tween.play();
                });
              }
              return tween;
            },
          });
        } catch {
          const tween = gsap.fromTo(
            el,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration,
              delay,
              paused: true,
              onComplete: () => markRevealed(el),
            },
          );
          disarm = arm(el, trigger, start, () => tween.play());
        }
      });

      return () => {
        disposed = true;
        disarm?.();
        activeTween?.kill();
        split?.revert();
      };
    },
    {
      scope: ref,
      dependencies: [by, delay, duration, stagger, trigger, start],
    },
  );

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

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotionNow()) return;

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
      return () => disarm();
    },
    { scope: ref, dependencies: [delay, trigger, start] },
  );

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

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotionNow()) return;
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
      return () => disarm();
    },
    { scope: ref, dependencies: [delay, y, duration, trigger, start] },
  );

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

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotionNow()) return;
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
      return () => disarm();
    },
    { scope: ref, dependencies: [delay, trigger, start] },
  );

  return (
    <div
      ref={ref}
      data-reveal="line"
      className={className}
      aria-hidden="true"
    />
  );
}

/** Quiet page-enter for tool surfaces (write, admin, dashboard). */
export function PageEnter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotionNow()) {
        if (el) el.dataset.revealed = "true";
        return;
      }
      gsap.fromTo(
        el,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "expo.out",
          onComplete: () => {
            gsap.set(el, { clearProps: "transform,opacity" });
            el.dataset.revealed = "true";
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div ref={ref} data-reveal="fade" className={className}>
      {children}
    </div>
  );
}
