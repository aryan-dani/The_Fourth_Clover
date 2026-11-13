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
  Table as TableIcon,
  Calculator,
  Workflow,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { uploadLosslessPostImage } from "../lib/upload-media";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

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
        <div className="relative left-0 z-40 flex select-none items-center sm:-left-8 md:-left-10">
          {!isOpen ? (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex h-7 w-7 items-center justify-center border border-[hsl(var(--border))] bg-background text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              title="Add media, code block, or diagram"
              aria-label="Floating add menu"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
              ) : (
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
            </button>
          ) : (
            <div className="animate-in fade-in zoom-in-95 flex items-center gap-0.5 border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1 py-1 duration-150">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-[hsl(var(--surface))] hover:text-foreground"
                title="Close menu (Esc)"
                aria-label="Close menu"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>

              <span className="mx-0.5 h-4 w-px bg-[hsl(var(--border))]" aria-hidden />

              {(
                [
                  {
                    key: "image",
                    title: "Upload image",
                    icon: <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.75} />,
                    onClick: () => fileInputRef.current?.click(),
                  },
                  {
                    key: "embed",
                    title: "Embed media",
                    icon: <Video className="h-3.5 w-3.5" strokeWidth={1.75} />,
                    onClick: () => {
                      editor.chain().focus().setEmbed({ url: "" }).run();
                      setIsOpen(false);
                    },
                  },
                  {
                    key: "code",
                    title: "Code block",
                    icon: <Code2 className="h-3.5 w-3.5" strokeWidth={1.75} />,
                    onClick: () => {
                      editor
                        .chain()
                        .focus()
                        .setCodeBlock({ language: "typescript" })
                        .run();
                      setIsOpen(false);
                    },
                  },
                  {
                    key: "rule",
                    title: "Section divider",
                    icon: <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />,
                    onClick: () => {
                      editor.chain().focus().setHorizontalRule().run();
                      setIsOpen(false);
                    },
                  },
                ] as const
              ).map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={action.onClick}
                  className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-[hsl(var(--surface))] hover:text-foreground"
                  title={action.title}
                >
                  {action.icon}
                </button>
              ))}

              <Popover open={unsplashOpen} onOpenChange={setUnsplashOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-[hsl(var(--surface))] hover:text-foreground"
                    title="Search Unsplash photo"
                  >
                    <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="z-50 w-80 rounded-none border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-none">
                  <form onSubmit={handleSearchUnsplash} className="flex gap-2">
                    <input
                      type="text"
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      placeholder="Search photos…"
                      className="flex-1 border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    />
                    <button
                      type="submit"
                      disabled={unsplashLoading}
                      className="bg-foreground px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-background disabled:opacity-50"
                    >
                      {unsplashLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Search"
                      )}
                    </button>
                  </form>

                  <div className="mt-3 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto">
                    {unsplashResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => insertUnsplashImage(item)}
                        className="group relative aspect-video overflow-hidden border border-[hsl(var(--border))] bg-muted focus:outline-none focus:ring-1 focus:ring-foreground/25"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumb}
                          alt={`Photo by ${item.author}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-0.5 text-left text-[10px] text-white truncate">
                          {item.author}
                        </span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-[hsl(var(--surface))] hover:text-foreground"
                    title="More blocks"
                  >
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="z-50 w-56 rounded-none border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 shadow-none">
                  <div className="flex flex-col gap-0.5">
                    {(
                      [
                        {
                          label: "Callout",
                          icon: (
                            <MessageSquare
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                            />
                          ),
                          onClick: () => {
                            editor
                              .chain()
                              .focus()
                              .setCallout({ type: "note" })
                              .run();
                            setIsOpen(false);
                          },
                        },
                        {
                          label: "LaTeX Math",
                          icon: (
                            <Calculator
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                            />
                          ),
                          onClick: () => {
                            editor.chain().focus().setMathBlock().run();
                            setIsOpen(false);
                          },
                        },
                        {
                          label: "Mermaid",
                          icon: (
                            <Workflow
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                            />
                          ),
                          onClick: () => {
                            editor.chain().focus().setMermaid().run();
                            setIsOpen(false);
                          },
                        },
                        {
                          label: "Table",
                          icon: (
                            <TableIcon
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                            />
                          ),
                          onClick: () => {
                            editor
                              .chain()
                              .focus()
                              .insertTable({
                                rows: 3,
                                cols: 3,
                                withHeaderRow: true,
                              })
                              .run();
                            setIsOpen(false);
                          },
                        },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        className="flex items-center gap-2 px-2.5 py-2 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-[hsl(var(--surface))] hover:text-foreground"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
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
