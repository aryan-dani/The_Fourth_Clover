"use client";

import React, { useState, useEffect, useId } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import mermaid from "mermaid";
import { Code2, Eye, Trash2, AlertCircle } from "lucide-react";

export function MermaidNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const code = (node.attrs.code as string) || `graph TD\n  Client[Web / Mobile] --> Gateway[API Gateway]\n  Gateway --> Auth[Auth Service]\n  Gateway --> Core[Core Engine]\n  Core --> DB[(PostgreSQL)]`;
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
      className="mermaid-nodeview group relative my-6 rounded-xl border border-border/80 bg-[#0d1117] p-4 text-[#e6edf3]"
      data-mermaid={code}
    >
      {/* Control bar */}
      <div
        contentEditable={false}
        className="mb-3 flex items-center justify-between border-b border-white/10 pb-2 select-none"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-brand-bright">
            Mermaid Diagram
          </span>

          <div className="inline-flex rounded-lg border border-white/10 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("diagram")}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-sans ${
                viewMode === "diagram"
                  ? "bg-brand text-brand-foreground font-medium"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-sans ${
                viewMode === "code"
                  ? "bg-brand text-brand-foreground font-medium"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Code2 className="h-3 w-3" />
              <span>Code</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={deleteNode}
          className="text-muted-foreground hover:text-destructive p-1 rounded"
          title="Delete diagram"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {viewMode === "code" ? (
        <div contentEditable={false} className="space-y-2">
          <textarea
            value={code}
            rows={6}
            onChange={(e) => updateAttributes({ code: e.target.value })}
            placeholder="graph TD..."
            className="w-full rounded-lg border border-white/10 bg-[#161b22] p-3 font-mono text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div contentEditable={false} className="overflow-x-auto py-4 text-center">
          {error ? (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 text-left">
              <p className="font-semibold">Mermaid rendering error:</p>
              <p className="font-mono mt-1">{error}</p>
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className="mt-2 text-xs underline hover:text-rose-300"
              >
                Switch to code mode to fix
              </button>
            </div>
          ) : (
            <div
              className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}
