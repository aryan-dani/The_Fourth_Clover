"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

const LIGHT = "#F2ECE0";
const DARK = "#17211A";

function setThemeColor(color: string) {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
}

/** Keeps <meta name="theme-color"> in sync with light / dark mode. */
export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const apply = () => {
      const dark =
        resolvedTheme === "dark" ||
        document.documentElement.classList.contains("dark");
      setThemeColor(dark ? DARK : LIGHT);
    };

    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [resolvedTheme]);

  return null;
}
