"use client";

import React, { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  AlignLeft,
  Maximize2,
  Minimize2,
  Trash2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function FigureImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const [altModalOpen, setAltModalOpen] = useState(false);
  const src = (node.attrs.src as string) || "";
  const alt = (node.attrs.alt as string) || "";
  const caption = (node.attrs.caption as string) || "";
  const layout = (node.attrs.layout as "default" | "wide" | "full") || "default";
  const width = node.attrs.width as number | undefined;
  const height = node.attrs.height as number | undefined;

  const layoutContainerClass = {
    default: "max-w-[68ch] mx-auto",
    wide: "max-w-5xl mx-auto px-2 sm:px-4",
    full: "w-full max-w-none my-10",
  }[layout];

  return (
    <NodeViewWrapper
      className={cn(
        "figure-image-nodeview group relative my-8 transition-all select-none",
        layoutContainerClass,
      )}
      data-layout={layout}
    >
      {/* Floating Toolbar on Hover / Selection */}
      <div
        contentEditable={false}
        className={cn(
          "absolute -top-11 left-1/2 z-30 -translate-x-1/2 flex items-center gap-1 rounded-full border border-border/80 bg-background/95 px-2 py-1 shadow-lg backdrop-blur-md transition-opacity duration-150 select-none",
          selected ? "opacity-100 visible" : "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
        )}
      >
        <button
          type="button"
          onClick={() => updateAttributes({ layout: "default" })}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors",
            layout === "default"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          title="Column width (68ch)"
        >
          <AlignLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Inline</span>
        </button>

        <button
          type="button"
          onClick={() => updateAttributes({ layout: "wide" })}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors",
            layout === "wide"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          title="Wide / Outset width"
        >
          <Minimize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Wide</span>
        </button>

        <button
          type="button"
          onClick={() => updateAttributes({ layout: "full" })}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors",
            layout === "full"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          title="Full-bleed width"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Full</span>
        </button>

        <span className="h-3.5 w-px bg-border/60 mx-1" aria-hidden />

        {/* Alt text edit button */}
        <button
          type="button"
          onClick={() => setAltModalOpen(!altModalOpen)}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs font-medium transition-colors",
            altModalOpen || alt
              ? "text-brand hover:text-brand-bright"
              : "text-muted-foreground hover:text-foreground",
          )}
          title="Edit image alt text (for screen readers and SEO)"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Alt</span>
        </button>

        {/* Open full-res in new tab */}
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 items-center justify-center rounded-full px-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Open full resolution in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={deleteNode}
          className="inline-flex h-7 items-center justify-center rounded-full px-1.5 text-destructive hover:bg-destructive/10"
          title="Delete image"
          aria-label="Delete image"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Alt text popover input */}
      {altModalOpen && (
        <div
          contentEditable={false}
          className="absolute top-0 inset-x-4 z-30 mx-auto max-w-md rounded-xl border border-border bg-background p-3 shadow-xl select-none"
        >
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Alt Text (for accessibility & SEO)
          </label>
          <input
            type="text"
            value={alt}
            autoFocus
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                setAltModalOpen(false);
              }
            }}
            placeholder="Describe the image or diagram..."
            className="w-full rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAltModalOpen(false)}
              className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Image Container */}
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-muted/20 transition-all",
          selected ? "border-brand ring-2 ring-brand/30" : "border-border/60 hover:border-border",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || "Article diagram"}
          width={width}
          height={height}
          loading="lazy"
          className="h-auto w-full object-contain mx-auto"
        />
      </div>

      {/* Editable Caption Directly Underneath */}
      <div contentEditable={false} className="mt-2 text-center">
        <input
          type="text"
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="Type an optional caption for this figure..."
          className="w-full border-0 bg-transparent text-center font-serif text-sm italic text-muted-foreground placeholder:text-muted-foreground/40 focus:text-foreground focus:outline-none"
        />
      </div>
    </NodeViewWrapper>
  );
}
