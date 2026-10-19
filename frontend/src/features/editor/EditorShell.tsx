"use client";

import Link from "next/link";
import { ArrowLeft, Eye, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EditorMode = "write" | "preview";

export type EditorShellAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

type EditorShellProps = {
  backHref: string;
  backLabel?: string;
  saveStatus: string;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  primaryAction: EditorShellAction;
  secondaryAction?: EditorShellAction;
  settingsTrigger?: React.ReactNode;
  banner?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function EditorShell({
  backHref,
  backLabel = "Back",
  saveStatus,
  mode,
  onModeChange,
  primaryAction,
  secondaryAction,
  settingsTrigger,
  banner,
  children,
  className,
}: EditorShellProps) {
  return (
    <div className={cn("relative min-h-screen bg-background", className)}>
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link
            href={backHref}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>

          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {saveStatus}
          </span>

          <div className="inline-flex shrink-0 rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => onModeChange("write")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                mode === "write"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <PenLine className="h-3 w-3" />
              Write
            </button>
            <button
              type="button"
              onClick={() => onModeChange("preview")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                mode === "preview"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>
          </div>

          {settingsTrigger}

          {secondaryAction && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-md px-3 text-xs"
              disabled={secondaryAction.disabled || secondaryAction.loading}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.loading && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              {secondaryAction.label}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            className="h-8 rounded-md px-3 text-xs"
            disabled={primaryAction.disabled || primaryAction.loading}
            onClick={primaryAction.onClick}
          >
            {primaryAction.loading && (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            {primaryAction.label}
          </Button>
        </div>
      </header>

      {banner && (
        <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6">
          {banner}
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </div>
    </div>
  );
}
