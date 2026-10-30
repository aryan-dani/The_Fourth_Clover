"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NAV_ICON_CLASS, NAV_STROKE } from "@/components/layout/nav-metrics";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn("nav-icon", className)}
        disabled
        aria-hidden
      >
        <Sun className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn("nav-icon", className)}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
          ) : (
            <Moon className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        <p className="text-xs font-medium">
          {isDark ? "Light mode" : "Dark mode"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
