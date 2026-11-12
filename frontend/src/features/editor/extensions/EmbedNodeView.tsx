"use client";

import React, { useState, useEffect } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  ExternalLink,
  Trash2,
  Edit2,
  Video,
  Globe,
  FileText,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons/BrandIcons";

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
  );
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
  return match ? match[3] : null;
}

function isTwitterOrX(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+$/i.test(url);
}

function isGithub(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?github\.com\/.+$/i.test(url);
}

function isArxiv(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?arxiv\.org\/.+$/i.test(url);
}

export function EmbedNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const url = (node.attrs.url as string) || "";
  const [inputUrl, setInputUrl] = useState(url);
  const [isEditing, setIsEditing] = useState(!url);

  useEffect(() => {
    setInputUrl(url);
    if (!url) setIsEditing(true);
  }, [url]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputUrl.trim();
      if (trimmed) {
        let finalUrl = trimmed;
        if (!/^https?:\/\//i.test(finalUrl)) {
          finalUrl = `https://${finalUrl}`;
        }
        updateAttributes({ url: finalUrl });
        setIsEditing(false);
      }
    } else if (e.key === "Escape") {
      if (!url) {
        deleteNode();
      } else {
        setIsEditing(false);
      }
    } else if (e.key === "Backspace" && !inputUrl) {
      deleteNode();
    }
  };

  const youtubeId = url ? getYouTubeId(url) : null;
  const vimeoId = url ? getVimeoId(url) : null;

  if (isEditing) {
    return (
      <NodeViewWrapper className="embed-prompt my-6">
        <div
          contentEditable={false}
          className="relative flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3.5 transition-colors focus-within:border-brand focus-within:bg-muted/40"
        >
          <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="url"
            value={inputUrl}
            autoFocus
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste a link to embed (YouTube, X/Twitter, GitHub, ArXiv, article) and press Enter…"
            className="w-full bg-transparent font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={deleteNode}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            Cancel
          </button>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className="embed-nodeview group relative my-8"
      data-embed-url={url}
    >
      {/* Floating control bar */}
      <div
        contentEditable={false}
        className={`absolute -top-10 right-2 z-20 flex items-center gap-1 rounded-full border border-border bg-background/95 px-2 py-0.5 shadow-md backdrop-blur-md transition-opacity ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          title="Edit URL"
        >
          <Edit2 className="h-3 w-3" />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          title="Open in new tab"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
        <button
          type="button"
          onClick={deleteNode}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
          title="Remove embed"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Render Embed based on URL type */}
      {youtubeId ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-black shadow-md">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      ) : vimeoId ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-black shadow-md">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title="Vimeo video player"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      ) : (
        /* Sleek Editorial Bookmark Card for X, GitHub, ArXiv, or generic articles */
        <div
          contentEditable={false}
          className="overflow-hidden rounded-xl border border-border/80 bg-card p-4 transition-colors hover:border-brand/60 hover:bg-muted/30"
        >
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between gap-4"
          >
            <span className="block min-w-0 flex-1 space-y-1.5">
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {isGithub(url) ? (
                  <>
                    <GitHubIcon className="h-3.5 w-3.5" />
                    <span>GitHub Repository</span>
                  </>
                ) : isTwitterOrX(url) ? (
                  <>
                    <span className="font-bold">𝕏</span>
                    <span>Post / Thread</span>
                  </>
                ) : isArxiv(url) ? (
                  <>
                    <FileText className="h-3.5 w-3.5" />
                    <span>ArXiv Preprint</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5" />
                    <span>Web Bookmark</span>
                  </>
                )}
              </span>
              <span className="block font-sans text-sm font-semibold text-foreground truncate">
                {url}
              </span>
              <span className="block font-sans text-xs text-muted-foreground line-clamp-2">
                Click to open external reference in a new window.
              </span>
            </span>
            <span className="block shrink-0 pt-1 text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
            </span>
          </a>
        </div>
      )}
    </NodeViewWrapper>
  );
}
