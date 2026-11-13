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
      offset={20}
      gap={12}
      toastOptions={{
        duration: 4200,
        unstyled: false,
        classNames: {
          toast: "tfc-toast group",
          title: "tfc-toast__title",
          description: "tfc-toast__description",
          content: "tfc-toast__content",
          icon: "tfc-toast__icon",
          success: "tfc-toast--success",
          error: "tfc-toast--error",
          warning: "tfc-toast--warning",
          info: "tfc-toast--info",
          closeButton: "tfc-toast__close",
        },
      }}
      icons={{
        success: (
          <CheckCircle2 className="size-4" strokeWidth={1.75} aria-hidden />
        ),
        error: <XCircle className="size-4" strokeWidth={1.75} aria-hidden />,
        info: <Info className="size-4" strokeWidth={1.75} aria-hidden />,
        warning: (
          <AlertTriangle className="size-4" strokeWidth={1.75} aria-hidden />
        ),
        loading: (
          <Loader2
            className="size-4 animate-spin text-muted-foreground"
            aria-hidden
          />
        ),
        close: <X className="size-3.5" strokeWidth={2} aria-hidden />,
      }}
    />
  );
}
