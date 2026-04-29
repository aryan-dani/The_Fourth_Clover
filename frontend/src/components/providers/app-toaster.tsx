"use client";

import type { ComponentProps } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";

type ToasterProps = ComponentProps<typeof Sonner>;

export function AppToaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  const sonnerTheme: ToasterProps["theme"] =
    resolvedTheme === "dark" ? "dark" : "light";

  return (
    <Sonner
      {...props}
      theme={sonnerTheme}
      position="bottom-right"
      closeButton
      offset={16}
      gap={10}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group font-sans !rounded-xl !border !p-4 !pr-12 !shadow-lg !gap-3 !items-center " +
            "!bg-card !text-foreground !border-border",
          title: "!text-sm !font-semibold !text-foreground !leading-snug",
          description:
            "!text-sm !text-muted-foreground !leading-relaxed !mt-0.5",
          content: "!gap-3",
          icon:
            "!m-0 !size-9 !shrink-0 !flex !items-center !justify-center " +
            "!rounded-lg !border !border-border/80 !bg-background/80 !shadow-none",
          success: "!border-emerald-500/25 dark:!border-emerald-400/30",
          error:
            "!border-destructive/40 [&_[data-icon]]:!text-destructive [&_[data-icon]]:!border-destructive/25",
          warning: "!border-amber-500/30 dark:!border-amber-400/35",
          info: "!border-primary/25",
          closeButton:
            "!m-0 !border !border-border !rounded-lg !bg-background !text-foreground " +
            "!opacity-90 hover:!opacity-100 !size-8 !inline-flex !items-center !justify-center !p-0 " +
            "[&_svg]:!block [&_svg]:!shrink-0 hover:!bg-muted dark:!bg-card dark:hover:!bg-muted",
        },
        style: {
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        },
      }}
      icons={{
        success: <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />,
        error: <XCircle className="size-5 text-destructive" />,
        info: <Info className="size-5 text-primary" />,
        warning: <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />,
        loading: (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ),
        close: (
          <X className="size-4 shrink-0 opacity-80 block" strokeWidth={2} aria-hidden />
        ),
      }}
    />
  );
}
