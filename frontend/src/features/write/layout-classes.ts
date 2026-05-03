import { cn } from "@/lib/utils";
import { WRITE_TOOLBAR_INSET_LEFT } from "@/components/layout/nav-metrics";

/**
 * Same horizontal inset as the write toolbar: logo (`left-4` + 52px) + trailing padding.
 * Do not pair with `mx-auto` on the same node — inset is viewport-relative.
 */
export const WRITE_CHROME_INSET_CLASS = cn(
  WRITE_TOOLBAR_INSET_LEFT,
  "pr-3 sm:pr-5 md:pr-6",
);

/**
 * Aligns write toolbar / editor with floating Header pills (`top-4`, pill `52px`).
 */
export const WRITE_TOOLBAR_TOP_CLASS =
  "top-[calc(1rem+52px+0.5rem)]";

/** Clears fixed pills + toolbar row (`h-11`) + gap */
export const WRITE_EDITOR_AREA_PT_CLASS =
  "pt-[calc(1rem+52px+0.5rem+2.75rem+1rem)]";

/** Sticky meta column below fixed chrome */
export const WRITE_SIDEBAR_STICKY_TOP_CLASS =
  "top-[calc(1rem+52px+0.5rem+2.75rem+0.75rem)]";
