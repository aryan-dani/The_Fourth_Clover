"use client";

import React, { useState, useMemo } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import katex from "katex";
import { Check, Copy, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MathNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const latex = (node.attrs.latex as string) || "E = mc^2";
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const renderedHtml = useMemo(() => {
    try {
      return katex.renderToString(latex || "\\dots", {
        displayMode: true,
        throwOnError: false,
      });
    } catch (err) {
      return `<span class="text-destructive font-mono text-xs">Invalid LaTeX: ${String(err)}</span>`;
    }
  }, [latex]);

  const handleCopyLatex = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <NodeViewWrapper
      className="math-nodeview group relative my-6 border border-[hsl(var(--border))] bg-[hsl(var(--surface))]/40 p-4 transition-colors"
      data-latex={latex}
    >
      <div
        contentEditable={false}
        className={cn(
          "absolute -top-3 right-3 flex select-none items-center gap-1 border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-0.5 text-xs transition-opacity",
          selected || isEditing
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
        )}
      >
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
        >
          <Edit2 className="h-3 w-3" strokeWidth={1.75} />
          <span>{isEditing ? "Done" : "Edit"}</span>
        </button>

        <span className="mx-1 h-3 w-px bg-[hsl(var(--border))]" aria-hidden />

        <button
          type="button"
          onClick={handleCopyLatex}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          title="Copy LaTeX"
        >
          {copied ? (
            <Check className="h-3 w-3 text-foreground" strokeWidth={1.75} />
          ) : (
            <Copy className="h-3 w-3" strokeWidth={1.75} />
          )}
        </button>

        <button
          type="button"
          onClick={deleteNode}
          className="inline-flex items-center p-0.5 text-muted-foreground hover:text-destructive"
          title="Delete math block"
        >
          <Trash2 className="h-3 w-3" strokeWidth={1.75} />
        </button>
      </div>

      {isEditing ? (
        <div contentEditable={false} className="space-y-3 pt-2">
          <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            LaTeX
          </label>
          <textarea
            value={latex}
            autoFocus
            rows={2}
            onChange={(e) => updateAttributes({ latex: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                setIsEditing(false);
              }
            }}
            placeholder="e.g. \nabla \times \mathbf{B} = \mu_0 \mathbf{J}"
            className="w-full border border-[hsl(var(--border))] bg-background p-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Cmd+Enter to finish</span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-foreground px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-background"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div
          contentEditable={false}
          onDoubleClick={() => setIsEditing(true)}
          className="cursor-pointer select-none overflow-x-auto py-2 text-center"
          title="Double-click to edit LaTeX formula"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      )}
    </NodeViewWrapper>
  );
}
