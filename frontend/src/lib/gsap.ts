import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  gsap.defaults({ ease: "expo.out", duration: 1.2 });
}

export const MOTION = {
  display: 1.3,
  ui: 0.6,
  stagger: 0.09,
  ease: "expo.out",
  easeInOut: "expo.inOut",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
