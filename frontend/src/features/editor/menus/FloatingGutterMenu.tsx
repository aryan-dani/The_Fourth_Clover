"use client";

import React, { useState, useRef, useEffect } from "react";
import { FloatingMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  Plus,
  X,
  Image as ImageIcon,
  Code2,
  Minus,
  Sparkles,
  Search,
  Video,
  FileCode,
  Table as TableIcon,
  Calculator,
  Workflow,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { uploadLosslessPostImage } from "../lib/upload-media";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FloatingGutterMenuProps = {
  editor: Editor;
  userId?: string | null;
};

export function FloatingGutterMenu({ editor, userId }: FloatingGutterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<
    Array<{ id: string; url: string; thumb: string; author: string; authorUrl: string }>
  >([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setUnsplashOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Suppress editor placeholder when floating menu is open
  useEffect(() => {
    if (!editor || !editor.view || !editor.view.dom) return;
    if (isOpen) {
      editor.view.dom.classList.add("floating-menu-open");
    } else {
      editor.view.dom.classList.remove("floating-menu-open");
    }
    return () => {
      editor.view?.dom?.classList.remove("floating-menu-open");
    };
  }, [isOpen, editor]);

  // Auto-close menu if user types or moves away from empty paragraph
  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      const { $from } = editor.state.selection;
      const isParagraph = $from.parent.type.name === "paragraph";
      const isNodeEmpty = $from.parent.textContent.length === 0;
      if (!isParagraph || !isNodeEmpty) {
        setIsOpen(false);
      }
    };
    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setIsOpen(false);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadLosslessPostImage(file, { userId });
        if (uploaded) {
          editor
            .chain()
            .focus()
            .setFigureImage({
              src: uploaded.url,
              alt: uploaded.alt,
              width: uploaded.width,
              height: uploaded.height,
              layout: "default",
            })
            .run();
        }
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSearchUnsplash = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!unsplashQuery.trim()) return;
    setUnsplashLoading(true);
    try {
      const q = encodeURIComponent(unsplashQuery.trim());
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=6`, {
        headers: {
          Authorization: `Client-ID 7lVbI_1j-VqYm6L2qL07XF3G58R2-M1N3bK4P9w0x8y`,
        },
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        const mapped = ((data.results || []) as Array<{
          id: string;
          urls: { regular: string; small: string };
          user: { name: string; links: { html: string } };
        }>).map((item) => ({
          id: item.id,
          url: item.urls.regular,
          thumb: item.urls.small,
          author: item.user.name,
          authorUrl: item.user.links.html,
        }));
        setUnsplashResults(mapped);
      } else {
        // Fallback placeholder images if no API key is active
        const fallbacks = [
          {
            id: "f1",
            url: `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80`,
            thumb: `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80`,
            author: "Alexandre Debiève",
            authorUrl: "https://unsplash.com",
          },
          {
            id: "f2",
            url: `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80`,
            thumb: `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80`,
            author: "Markus Spiske",
            authorUrl: "https://unsplash.com",
          },
        ];
        setUnsplashResults(fallbacks);
      }
    } catch {
      toast.error("Could not fetch photos from Unsplash.");
    } finally {
      setUnsplashLoading(false);
    }
  };

  const insertUnsplashImage = (item: { url: string; author: string; authorUrl: string }) => {
    editor
      .chain()
      .focus()
      .setFigureImage({
        src: item.url,
        alt: `Photo by ${item.author} on Unsplash`,
        caption: `Photo by ${item.author} on Unsplash`,
        layout: "default",
      })
      .run();
    setUnsplashOpen(false);
    setIsOpen(false);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleImageFileChange}
        className="hidden"
      />

      <FloatingMenu
        editor={editor}
        shouldShow={({ state }) => {
          const { $from } = state.selection;
          const isParagraph = $from.parent.type.name === "paragraph";
          const isNodeEmpty = $from.parent.textContent.length === 0;
          return isParagraph && isNodeEmpty;
        }}
      >
        <div className="relative left-0 sm:-left-8 md:-left-10 flex items-center select-none z-40">
          {!isOpen ? (
            /* Closed State: Single circular + button in the left gutter */
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-400/60 bg-background text-foreground shadow-sm transition-all duration-200 hover:scale-110 hover:border-foreground dark:border-zinc-600"
              title="Add media, code block, or diagram"
              aria-label="Floating add menu"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
              ) : (
                <Plus className="h-4 w-4 stroke-[2]" />
              )}
            </button>
          ) : (
            /* Open State: Solid, insulated, self-contained editorial pill */
            <div className="flex items-center gap-1 rounded-full border border-border/80 bg-popover px-1.5 py-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ring-1 ring-border/40">
              {/* Rotate to X */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/20 bg-muted/60 text-foreground transition-all hover:bg-muted hover:border-foreground"
                title="Close menu (Esc)"
                aria-label="Close menu"
              >
                <X className="h-3.5 w-3.5 stroke-[2]" />
              </button>

              <span className="h-3.5 w-px bg-border/60 mx-0.5" aria-hidden />

              {/* 1. Add Image Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-600/40 bg-background text-emerald-600 shadow-sm transition-transform hover:scale-110 hover:border-emerald-600 dark:border-emerald-400/40 dark:text-emerald-400"
                title="Upload high-res image or diagram"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>

              {/* 2. Unsplash Search Popover */}
              <Popover open={unsplashOpen} onOpenChange={setUnsplashOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-600/40 bg-background text-emerald-600 shadow-sm transition-transform hover:scale-110 hover:border-emerald-600 dark:border-emerald-400/40 dark:text-emerald-400"
                    title="Search Unsplash photo"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3 rounded-2xl shadow-xl border-border bg-background z-50">
                  <form onSubmit={handleSearchUnsplash} className="flex gap-2">
                    <input
                      type="text"
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      placeholder="Search high-res photos…"
                      className="flex-1 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <button
                      type="submit"
                      disabled={unsplashLoading}
                      className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
                    >
                      {unsplashLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
                    </button>
                  </form>

                  <div className="mt-3 grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                    {unsplashResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => insertUnsplashImage(item)}
                        className="group relative aspect-video overflow-hidden rounded-lg border border-border/50 bg-muted focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumb}
                          alt={`Photo by ${item.author}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-0.5 text-[10px] text-white truncate text-left">
                          {item.author}
                        </span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* 3. Add Video / Embed (< >) */}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setEmbed({ url: "" }).run();
                  setIsOpen(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-600/40 bg-background text-emerald-600 shadow-sm transition-transform hover:scale-110 hover:border-emerald-600 dark:border-emerald-400/40 dark:text-emerald-400"
                title="Embed YouTube, Vimeo, X, GitHub, or bookmark"
              >
                <Video className="h-3.5 w-3.5" />
              </button>

              {/* 4. Add Code Block ({ }) */}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setCodeBlock({ language: "typescript" }).run();
                  setIsOpen(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-600/40 bg-background text-emerald-600 shadow-sm transition-transform hover:scale-110 hover:border-emerald-600 dark:border-emerald-400/40 dark:text-emerald-400"
                title="Insert IDE code block"
              >
                <Code2 className="h-3.5 w-3.5" />
              </button>

              {/* 5. Add Section Divider (...) */}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setHorizontalRule().run();
                  setIsOpen(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-600/40 bg-background text-emerald-600 shadow-sm transition-transform hover:scale-110 hover:border-emerald-600 dark:border-emerald-400/40 dark:text-emerald-400"
                title="Insert section divider"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              {/* 6. Technical Blocks Popover (+ More) */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-600/40 bg-background text-emerald-600 shadow-sm transition-transform hover:scale-110 hover:border-emerald-600 dark:border-emerald-400/40 dark:text-emerald-400"
                    title="More technical blocks: Callout, LaTeX Math, Mermaid diagram, Table"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1.5 rounded-xl shadow-xl border-border bg-background z-50">
                  <div className="flex flex-col gap-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        editor.chain().focus().setCallout({ type: "note" }).run();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-sky-500" />
                      <span>Callout / Admonition</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        editor.chain().focus().setMathBlock().run();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Calculator className="h-3.5 w-3.5 text-purple-500" />
                      <span>LaTeX Math Block</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        editor.chain().focus().setMermaid().run();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Workflow className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Mermaid Diagram</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <TableIcon className="h-3.5 w-3.5 text-amber-500" />
                      <span>Interactive Table</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </FloatingMenu>
    </>
  );
}
