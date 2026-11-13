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

function ToolButton({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-[hsl(var(--surface))] hover:text-foreground",
        active && "bg-[hsl(var(--surface))] text-foreground",
      )}
    >
      {children}
    </button>
  );
}

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
    if (
      !/^https?:\/\//i.test(finalUrl) &&
      !finalUrl.startsWith("/") &&
      !finalUrl.startsWith("#")
    ) {
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
        const hasSelection = from !== to;
        const isCodeBlock = editor.isActive("codeBlock");
        const isFigure = editor.isActive("figureImage");
        const isEmbed = editor.isActive("embed");
        return hasSelection && !isCodeBlock && !isFigure && !isEmbed;
      }}
    >
      <div className="flex select-none items-center gap-0.5 border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1 py-1 text-foreground">
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
              className="h-7 w-44 border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 font-sans text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />

            <button
              type="button"
              onClick={() => setOpenInNewTab(!openInNewTab)}
              className={cn(
                "inline-flex h-7 items-center gap-1 px-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors",
                openInNewTab
                  ? "bg-[hsl(var(--surface))] text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Open in new tab"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
              <span>New</span>
            </button>

            <button
              type="button"
              onClick={handleApplyLink}
              className="flex h-7 w-7 items-center justify-center bg-foreground text-background"
              title="Apply link"
            >
              <Check className="h-3 w-3" strokeWidth={1.75} />
            </button>

            {editor.isActive("link") && (
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setLinkInputOpen(false);
                }}
                className="flex h-7 w-7 items-center justify-center text-destructive hover:bg-destructive/10"
                title="Remove link"
              >
                <Unlink className="h-3 w-3" strokeWidth={1.75} />
              </button>
            )}
          </div>
        ) : (
          <>
            <ToolButton
              title="Bold (Cmd+B)"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Italic (Cmd+I)"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Underline (Cmd+U)"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Strikethrough"
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Inline Code (Cmd+E)"
              active={editor.isActive("code")}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Highlight"
              active={editor.isActive("highlight")}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
            >
              <Highlighter className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Link"
              active={editor.isActive("link")}
              onClick={openLinkEditor}
            >
              <Link2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>

            <span
              className="mx-1 h-4 w-px bg-[hsl(var(--border))]"
              aria-hidden
            />

            <ToolButton
              title="Heading 2"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Heading 3"
              active={editor.isActive("heading", { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Quote"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Bullet list"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Numbered list"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Task list"
              active={editor.isActive("taskList")}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
            >
              <ListTodo className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              title="Wrap in code block"
              active={editor.isActive("codeBlock")}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setCodeBlock({ language: "typescript" })
                  .run()
              }
            >
              <Code2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ToolButton>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
