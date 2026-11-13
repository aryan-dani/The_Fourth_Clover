"use client";

import React, { useState, useEffect, useId } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import mermaid from "mermaid";
import { Code2, Eye, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function MermaidNodeView({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const code =
    (node.attrs.code as string) ||
    `graph TD\n  Client[Web / Mobile] --> Gateway[API Gateway]\n  Gateway --> Auth[Auth Service]\n  Gateway --> Core[Core Engine]\n  Core --> DB[(PostgreSQL)]`;
  const [viewMode, setViewMode] = useState<"diagram" | "code">("diagram");
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const rawId = useId().replace(/:/g, "");
  const mermaidId = `mermaid-${rawId}`;

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "var(--font-mono)",
        });
        const { svg: renderedSvg } = await mermaid.render(mermaidId, code);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mermaid syntax error");
        }
      }
    };

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code, mermaidId]);

  return (
    <NodeViewWrapper
      className="mermaid-nodeview group relative my-6 border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-foreground"
      data-mermaid={code}
    >
      <div
        contentEditable={false}
        className="mb-3 flex select-none items-center justify-between border-b border-[hsl(var(--border))] pb-2"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Mermaid
          </span>

          <div className="inline-flex border border-[hsl(var(--border))] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("diagram")}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                viewMode === "diagram"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Eye className="h-3 w-3" strokeWidth={1.75} />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                viewMode === "code"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Code2 className="h-3 w-3" strokeWidth={1.75} />
              <span>Code</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={deleteNode}
          className="p-1 text-muted-foreground transition-colors hover:text-destructive"
          title="Delete diagram"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>

      {viewMode === "code" ? (
        <div contentEditable={false} className="space-y-2">
          <textarea
            value={code}
            rows={6}
            onChange={(e) => updateAttributes({ code: e.target.value })}
            placeholder="graph TD..."
            className="w-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div contentEditable={false} className="overflow-x-auto py-4 text-center">
          {error ? (
            <div className="border border-destructive/30 bg-destructive/10 p-3 text-left text-xs text-destructive">
              <p className="font-semibold">Mermaid rendering error</p>
              <p className="mt-1 font-mono">{error}</p>
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className="mt-2 text-xs underline hover:opacity-80"
              >
                Switch to code mode to fix
              </button>
            </div>
          ) : (
            <div
              className="flex justify-center [&>svg]:h-auto [&>svg]:max-w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}
