"use client";

import React, { useState, useMemo } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import katex from "katex";
import { Check, Copy, Edit2, Trash2 } from "lucide-react";

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
      className="math-nodeview group relative my-6 rounded-xl border border-border/60 bg-muted/20 p-4 transition-all"
      data-latex={latex}
    >
      {/* Action toolbar on hover/focus */}
      <div
        contentEditable={false}
        className={`absolute -top-3.5 right-3 flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 shadow-sm text-xs select-none transition-opacity ${
          selected || isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <Edit2 className="h-3 w-3" />
          <span>{isEditing ? "Done" : "Edit LaTeX"}</span>
        </button>

        <span className="h-3 w-px bg-border/60 mx-1" aria-hidden />

        <button
          type="button"
          onClick={handleCopyLatex}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          title="Copy LaTeX"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>

        <button
          type="button"
          onClick={deleteNode}
          className="inline-flex items-center text-destructive hover:bg-destructive/10 p-0.5 rounded"
          title="Delete math block"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {isEditing ? (
        <div contentEditable={false} className="space-y-3 pt-2">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            LaTeX Math Formula
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
            placeholder="e.g. \nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}"
            className="w-full rounded-md border border-border bg-background p-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press Cmd+Enter or click Done when finished</span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded bg-brand px-3 py-1 font-medium text-brand-foreground hover:bg-brand/90"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div
          contentEditable={false}
          onDoubleClick={() => setIsEditing(true)}
          className="overflow-x-auto py-2 text-center cursor-pointer select-none"
          title="Double-click to edit LaTeX formula"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      )}
    </NodeViewWrapper>
  );
}
