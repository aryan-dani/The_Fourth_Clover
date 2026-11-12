"use client";

import React, { useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Link2,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  ListTodo,
  ExternalLink,
  Unlink,
  Code2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SelectionBubbleMenuProps = {
  editor: Editor;
};

export function SelectionBubbleMenu({ editor }: SelectionBubbleMenuProps) {
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);

  const openLinkEditor = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    setUrl(previousUrl);
    setOpenInNewTab(editor.getAttributes("link").target === "_blank");
    setLinkInputOpen(true);
  };

  const handleApplyLink = () => {
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkInputOpen(false);
      return;
    }

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith("/") && !finalUrl.startsWith("#")) {
      finalUrl = `https://${finalUrl}`;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: finalUrl,
        target: openInNewTab ? "_blank" : undefined,
      })
      .run();

    setLinkInputOpen(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor, from, to }) => {
        // Only show if text is selected, and not inside code blocks or images
        const hasSelection = from !== to;
        const isCodeBlock = editor.isActive("codeBlock");
        const isFigure = editor.isActive("figureImage");
        const isEmbed = editor.isActive("embed");
        return hasSelection && !isCodeBlock && !isFigure && !isEmbed;
      }}
    >
      <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-[#16181d]/95 px-2 py-1 shadow-2xl backdrop-blur-md select-none text-zinc-300">
        {linkInputOpen ? (
          <div className="flex items-center gap-1.5 px-1 py-0.5">
            <input
              type="url"
              value={url}
              autoFocus
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyLink();
                } else if (e.key === "Escape") {
                  setLinkInputOpen(false);
                }
              }}
              placeholder="Paste or type URL…"
              className="h-6 w-44 rounded bg-[#21262d] px-2 font-sans text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand"
            />

            <button
              type="button"
              onClick={() => setOpenInNewTab(!openInNewTab)}
              className={cn(
                "inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-sans transition-colors",
                openInNewTab
                  ? "bg-brand/20 text-brand-bright font-medium"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
              title="Open in new tab"
            >
              <ExternalLink className="h-3 w-3" />
              <span>New tab</span>
            </button>

            <button
              type="button"
              onClick={handleApplyLink}
              className="flex h-6 w-6 items-center justify-center rounded bg-brand text-brand-foreground hover:bg-brand/90"
              title="Apply link"
            >
              <Check className="h-3 w-3" />
            </button>

            {editor.isActive("link") && (
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setLinkInputOpen(false);
                }}
                className="flex h-6 w-6 items-center justify-center rounded text-rose-400 hover:bg-rose-500/20"
                title="Remove link"
              >
                <Unlink className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Inline Marks */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("bold") && "bg-white/20 text-white font-bold",
              )}
              title="Bold (Cmd+B)"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("italic") && "bg-white/20 text-white font-semibold",
              )}
              title="Italic (Cmd+I)"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("underline") && "bg-white/20 text-white",
              )}
              title="Underline (Cmd+U)"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("strike") && "bg-white/20 text-white",
              )}
              title="Strikethrough"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("code") && "bg-white/20 text-white",
              )}
              title="Inline Code (Cmd+E)"
            >
              <Code className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("highlight") && "bg-amber-400/30 text-amber-300",
              )}
              title="Highlight"
            >
              <Highlighter className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={openLinkEditor}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("link") && "bg-brand/30 text-brand-bright",
              )}
              title="Link"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>

            <span className="h-4 w-px bg-white/15 mx-1" aria-hidden />

            {/* Block Transforms */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("heading", { level: 2 }) && "bg-white/20 text-white font-bold",
              )}
              title="Heading 2"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("heading", { level: 3 }) && "bg-white/20 text-white font-bold",
              )}
              title="Heading 3"
            >
              <Heading3 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("blockquote") && "bg-white/20 text-white",
              )}
              title="Quote"
            >
              <Quote className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("bulletList") && "bg-white/20 text-white",
              )}
              title="Bullet list"
            >
              <List className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("orderedList") && "bg-white/20 text-white",
              )}
              title="Numbered list"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("taskList") && "bg-white/20 text-white",
              )}
              title="Task list"
            >
              <ListTodo className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().setCodeBlock({ language: "typescript" }).run()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white",
                editor.isActive("codeBlock") && "bg-white/20 text-white",
              )}
              title="Wrap in IDE Code Block"
            >
              <Code2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
