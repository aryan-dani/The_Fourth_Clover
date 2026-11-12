"use client";

import React, { useState } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Check, Copy, WrapText, Hash } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "./lowlight-languages";

export function CodeBlockComponent({
  node,
  updateAttributes,
  extension,
}: NodeViewProps) {
  const [copied, setCopied] = useState(false);
  const currentLang = (node.attrs.language as string) || "typescript";
  const filename = (node.attrs.filename as string) || "";
  const showLineNumbers = Boolean(node.attrs.showLineNumbers);
  const wordWrap = Boolean(node.attrs.wordWrap);

  const handleCopy = async () => {
    try {
      const code = node.textContent;
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <NodeViewWrapper
      className="codeblock-nodeview relative my-6 overflow-hidden rounded-xl border border-border/80 bg-[#0d1117] text-[#e6edf3] shadow-sm transition-colors"
      data-language={currentLang}
      data-filename={filename || undefined}
    >
      {/* Code block IDE header */}
      <div
        contentEditable={false}
        className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#161b22] px-3 py-1.5 text-xs select-none"
      >
        <div className="flex items-center gap-2">
          {/* Mac-style traffic lights / decor */}
          <div className="flex items-center gap-1.5 pr-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
          </div>

          {/* Language Selector */}
          <select
            value={currentLang}
            onChange={(e) => updateAttributes({ language: e.target.value })}
            className="h-6 rounded bg-[#21262d] px-2 font-mono text-[11px] text-zinc-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id} className="bg-[#161b22] text-zinc-200">
                {lang.name}
              </option>
            ))}
          </select>

          {/* Optional Filename Input */}
          <input
            type="text"
            value={filename}
            onChange={(e) => updateAttributes({ filename: e.target.value })}
            placeholder="filename.ext"
            className="h-6 w-32 rounded bg-transparent px-2 font-mono text-[11px] text-zinc-400 placeholder:text-zinc-600 focus:bg-[#21262d] focus:text-zinc-200 focus:outline-none sm:w-44"
          />
        </div>

        <div className="flex items-center gap-1">
          {/* Line Numbers Toggle */}
          <button
            type="button"
            onClick={() => updateAttributes({ showLineNumbers: !showLineNumbers })}
            className={`inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-mono transition-colors ${
              showLineNumbers
                ? "bg-brand/20 text-brand-bright font-semibold"
                : "text-zinc-400 hover:bg-[#21262d] hover:text-zinc-200"
            }`}
            title="Toggle line numbers"
            aria-label="Toggle line numbers"
          >
            <Hash className="h-3 w-3" />
            <span className="hidden sm:inline">Lines</span>
          </button>

          {/* Word Wrap Toggle */}
          <button
            type="button"
            onClick={() => updateAttributes({ wordWrap: !wordWrap })}
            className={`inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-mono transition-colors ${
              wordWrap
                ? "bg-brand/20 text-brand-bright font-semibold"
                : "text-zinc-400 hover:bg-[#21262d] hover:text-zinc-200"
            }`}
            title="Toggle soft word wrap"
            aria-label="Toggle soft word wrap"
          >
            <WrapText className="h-3 w-3" />
            <span className="hidden sm:inline">Wrap</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-6 items-center gap-1 rounded bg-[#21262d] px-2 font-mono text-[11px] text-zinc-300 transition-colors hover:bg-[#30363d] hover:text-white"
            title="Copy code to clipboard"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code editor body */}
      <pre
        className={`p-4 text-sm font-mono leading-relaxed selection:bg-brand/40 ${
          wordWrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre"
        } ${showLineNumbers ? "has-line-numbers" : ""}`}
      >
        <NodeViewContent as={"code" as any} className={`language-${currentLang}`} />
      </pre>
    </NodeViewWrapper>
  );
}
