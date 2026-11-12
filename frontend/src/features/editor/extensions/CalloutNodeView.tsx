"use client";

import React from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  Info,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CalloutType = "note" | "mechanism" | "takeaway" | "warning" | "security";

const CALLOUT_CONFIG: Record<
  CalloutType,
  { label: string; icon: React.ReactNode; border: string; bg: string; text: string }
> = {
  note: {
    label: "Note",
    icon: <Info className="h-4 w-4 text-sky-500" />,
    border: "border-sky-500/40",
    bg: "bg-sky-500/5",
    text: "text-sky-700 dark:text-sky-300",
  },
  mechanism: {
    label: "Mechanism / Key Idea",
    icon: <Lightbulb className="h-4 w-4 text-emerald-500" />,
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/5",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  takeaway: {
    label: "Production Takeaway",
    icon: <Sparkles className="h-4 w-4 text-purple-500" />,
    border: "border-purple-500/40",
    bg: "bg-purple-500/5",
    text: "text-purple-700 dark:text-purple-300",
  },
  warning: {
    label: "Warning",
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    text: "text-amber-700 dark:text-amber-300",
  },
  security: {
    label: "Security Advisory",
    icon: <ShieldAlert className="h-4 w-4 text-rose-500" />,
    border: "border-rose-500/40",
    bg: "bg-rose-500/5",
    text: "text-rose-700 dark:text-rose-300",
  },
};

export function CalloutNodeView({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const currentType = (node.attrs.type as CalloutType) || "note";
  const config = CALLOUT_CONFIG[currentType] || CALLOUT_CONFIG.note;

  return (
    <NodeViewWrapper
      className={cn(
        "callout-nodeview group relative my-6 rounded-xl border-l-4 border p-4 transition-all",
        config.border,
        config.bg,
      )}
      data-callout-type={currentType}
    >
      {/* Header bar */}
      <div
        contentEditable={false}
        className="mb-2 flex items-center justify-between gap-2 select-none"
      >
        <div className="flex items-center gap-2">
          {config.icon}
          <select
            value={currentType}
            onChange={(e) => updateAttributes({ type: e.target.value as CalloutType })}
            className={cn(
              "h-6 rounded bg-transparent font-sans text-xs font-semibold uppercase tracking-wider focus:outline-none cursor-pointer",
              config.text,
            )}
          >
            <option value="note">Note</option>
            <option value="mechanism">Mechanism / Key Idea</option>
            <option value="takeaway">Production Takeaway</option>
            <option value="warning">Warning</option>
            <option value="security">Security Advisory</option>
          </select>
        </div>

        <button
          type="button"
          onClick={deleteNode}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          title="Remove callout"
          aria-label="Remove callout"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Editable Content */}
      <NodeViewContent className="callout-body font-sans text-sm leading-relaxed text-foreground/90 space-y-2" />
    </NodeViewWrapper>
  );
}
