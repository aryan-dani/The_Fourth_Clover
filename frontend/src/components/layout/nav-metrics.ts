/**
 * Floating dock metrics — shared by SiteHeader / write toolbar.
 */
export const NAV_DOCK_SHELL =
  "flex h-14 shrink-0 items-center rounded-2xl border border-hairline bg-card";

export const NAV_ICON_BOX =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full";

export const NAV_ICON_CLASS = "h-[18px] w-[18px]";
export const NAV_STROKE = 2 as const;

export const NAV_PILL_DIVIDER =
  "mx-0.5 h-7 w-px shrink-0 self-center bg-hairline";

/** Logo matches dock height; inset before write toolbar content */
export const WRITE_TOOLBAR_INSET_LEFT =
  "pl-[calc(1rem+3.25rem+0.25rem)] sm:pl-[calc(1rem+3.25rem+0.375rem)]";
