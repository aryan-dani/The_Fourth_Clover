/**
 * Floating header: compact capsule — center + right pills share one scale.
 * `52px` sits between `h-12` (48px) and `h-14` (56px) for a touch more vertical air.
 */
export const NAV_PILL_SHELL =
  "flex h-[52px] shrink-0 items-center rounded-full border backdrop-blur-xl overflow-hidden";

export const NAV_ICON_BOX =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full";

export const NAV_ICON_CLASS = "h-[18px] w-[18px]";
export const NAV_STROKE = 2 as const;

export const NAV_PILL_DIVIDER =
  "mx-0.5 h-7 w-px shrink-0 self-center bg-border/90";

/** Logo matches pill height; `left-4` + width + gap before write toolbar content */
export const WRITE_TOOLBAR_INSET_LEFT =
  "pl-[calc(1rem+3.25rem+0.25rem)] sm:pl-[calc(1rem+3.25rem+0.375rem)]";
