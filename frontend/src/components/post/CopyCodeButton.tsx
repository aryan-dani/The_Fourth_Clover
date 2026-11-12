"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyCodeButton({
  code,
  className = "",
}: {
  code: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 rounded bg-[#21262d] px-2 py-1 font-mono text-[11px] text-zinc-300 transition-colors hover:bg-[#30363d] hover:text-white select-none ${className}`}
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
  );
}
