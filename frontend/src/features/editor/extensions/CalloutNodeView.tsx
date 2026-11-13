"use client";

import React from "react";
import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import {
  Info,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Trash2,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CalloutType =
  | "note"
  | "mechanism"
  | "takeaway"
  | "warning"
  | "security";

const CALLOUT_OPTIONS: Array<{
  type: CalloutType;
  label: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  {
    type: "note",
    label: "Note",
    icon: <Info className="h-3.5 w-3.5" strokeWidth={1.75} />,
    accent: "text-sky-600 dark:text-sky-300",
  },
  {
    type: "mechanism",
    label: "Mechanism / Key Idea",
    icon: <Lightbulb className="h-3.5 w-3.5" strokeWidth={1.75} />,
    accent: "text-emerald-700 dark:text-emerald-300",
  },
  {
    type: "takeaway",
    label: "Production Takeaway",
    icon: <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />,
    accent: "text-violet-700 dark:text-violet-300",
  },
  {
    type: "warning",
    label: "Warning",
    icon: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />,
    accent: "text-amber-700 dark:text-amber-300",
  },
  {
    type: "security",
    label: "Security Advisory",
    icon: <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.75} />,
    accent: "text-rose-700 dark:text-rose-300",
  },
];

const CALLOUT_SHELL: Record<
  CalloutType,
  { border: string; rail: string; wash: string }
> = {
  note: {
    border: "border-sky-500/35",
    rail: "border-l-sky-500/70",
    wash: "bg-sky-500/[0.06]",
  },
  mechanism: {
    border: "border-emerald-500/35",
    rail: "border-l-emerald-500/70",
    wash: "bg-emerald-500/[0.06]",
  },
  takeaway: {
    border: "border-violet-500/35",
    rail: "border-l-violet-500/70",
    wash: "bg-violet-500/[0.06]",
  },
  warning: {
    border: "border-amber-500/40",
    rail: "border-l-amber-500/75",
    wash: "bg-amber-500/[0.07]",
  },
  security: {
    border: "border-rose-500/40",
    rail: "border-l-rose-500/75",
    wash: "bg-rose-500/[0.07]",
  },
};

export function CalloutNodeView({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const currentType = (node.attrs.type as CalloutType) || "note";
  const option =
    CALLOUT_OPTIONS.find((item) => item.type === currentType) ||
    CALLOUT_OPTIONS[0];
  const shell = CALLOUT_SHELL[currentType] || CALLOUT_SHELL.note;

  return (
    <NodeViewWrapper
      className={cn(
        "callout-nodeview group relative my-6 border border-l-4 p-4 transition-colors",
        "rounded-none",
        shell.border,
        shell.rail,
        shell.wash,
      )}
      data-callout-type={currentType}
    >
      <div
        contentEditable={false}
        className="mb-3 flex items-center justify-between gap-3 select-none"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex h-8 items-center gap-2 border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5",
                "font-mono text-[10px] font-medium uppercase tracking-[0.14em]",
                "text-foreground transition-colors hover:bg-[hsl(var(--surface))]",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--foreground))]/25",
                option.accent,
              )}
              aria-label="Change callout type"
            >
              <span className="inline-flex shrink-0 opacity-90">
                {option.icon}
              </span>
              <span className="max-w-[14rem] truncate">{option.label}</span>
              <ChevronDown
                className="ml-0.5 h-3.5 w-3.5 shrink-0 opacity-60"
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className={cn(
              "min-w-[15.5rem] rounded-none border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 shadow-none",
              "text-foreground",
            )}
          >
            {CALLOUT_OPTIONS.map((item) => {
              const selected = item.type === currentType;
              return (
                <DropdownMenuItem
                  key={item.type}
                  onSelect={() => updateAttributes({ type: item.type })}
                  className={cn(
                    "cursor-pointer gap-2 rounded-none px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.12em]",
                    "focus:bg-[hsl(var(--surface))] focus:text-foreground",
                    selected && "bg-[hsl(var(--surface))]",
                    item.accent,
                  )}
                >
                  <span className="inline-flex shrink-0 opacity-90">
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {selected ? (
                    <Check className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={deleteNode}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center border border-transparent",
            "text-muted-foreground opacity-0 transition-all",
            "hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--card))] hover:text-destructive",
            "group-hover:opacity-100 focus-visible:opacity-100",
          )}
          title="Remove callout"
          aria-label="Remove callout"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>

      <NodeViewContent className="callout-body space-y-2 font-sans text-sm leading-relaxed text-foreground/90" />
    </NodeViewWrapper>
  );
}
