import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "expo.out", duration: 1.2 });
}

export const MOTION = {
  display: 1.3,
  ui: 0.6,
  stagger: 0.09,
  ease: "expo.out",
  easeInOut: "expo.inOut",
} as const;

export { gsap, ScrollTrigger };
