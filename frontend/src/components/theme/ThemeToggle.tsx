"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  NAV_ICON_BOX,
  NAV_ICON_CLASS,
  NAV_STROKE,
} from "@/components/layout/nav-metrics";

const iconBtn = cn(
  NAV_ICON_BOX,
  "!h-10 !w-10 shrink-0 border-0 bg-transparent p-0 shadow-none",
  "text-foreground/85 hover:text-foreground hover:bg-muted/90 active:bg-muted"
);

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(iconBtn, className)}
        disabled
        aria-hidden
      >
        <Sun className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(iconBtn, className)}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
          ) : (
            <Moon className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        <p className="text-xs font-medium">
          {isDark ? "Light mode" : "Dark mode"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
