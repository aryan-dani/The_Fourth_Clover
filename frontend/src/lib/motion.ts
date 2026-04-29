import type { Transition } from "framer-motion";

/** Shared Framer Motion timing for botanical UI — use across Header, pages, cards */
export const motionEase = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: motionEase },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.45, ease: motionEase },
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 32,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 28,
};
