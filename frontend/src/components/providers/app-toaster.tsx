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
  const theme =
    resolvedTheme === "dark"
      ? "dark"
      : resolvedTheme === "light"
        ? "light"
        : "system";

  return (
    <Sonner
      {...props}
      theme={theme}
      position="bottom-right"
      closeButton
      offset={16}
      gap={10}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group font-sans !rounded-[var(--radius)] !border !py-3.5 !pl-4 !pr-12 !shadow-none !gap-3 !items-center " +
            "!bg-[hsl(var(--card))] !text-[hsl(var(--foreground))] !border-[hsl(var(--border))]",
          title:
            "!text-sm !font-medium !text-[hsl(var(--foreground))] !leading-snug !tracking-tight",
          description:
            "!text-sm !text-muted-foreground !leading-relaxed !mt-0.5",
          content: "!gap-3",
          icon:
            "!m-0 !size-8 !shrink-0 !flex !items-center !justify-center " +
            "!rounded-full !border !border-[hsl(var(--border))] !bg-transparent !shadow-none",
          success: "!border-[var(--brand-color)]/35",
          error:
            "!border-destructive/40 [&_[data-icon]]:!text-destructive",
          warning: "!border-[hsl(var(--border))]",
          info: "!border-[var(--brand-color)]/30",
          closeButton:
            "!left-auto !right-2.5 !top-1/2 !-translate-y-1/2 !m-0 !border-0 " +
            "!rounded-full !bg-transparent !text-muted-foreground " +
            "!opacity-80 hover:!opacity-100 !size-7 !inline-flex !items-center !justify-center !p-0 " +
            "hover:!bg-[hsl(var(--surface))] hover:!text-[hsl(var(--foreground))]",
        },
      }}
      icons={{
        success: (
          <CheckCircle2
            className="size-4 text-[var(--brand-color)]"
            strokeWidth={1.75}
          />
        ),
        error: <XCircle className="size-4 text-destructive" strokeWidth={1.75} />,
        info: (
          <Info className="size-4 text-[var(--brand-color)]" strokeWidth={1.75} />
        ),
        warning: (
          <AlertTriangle
            className="size-4 text-[hsl(var(--foreground))]"
            strokeWidth={1.75}
          />
        ),
        loading: (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ),
        close: (
          <X
            className="size-3.5 shrink-0 block"
            strokeWidth={2}
            aria-hidden
          />
        ),
      }}
    />
  );
}
