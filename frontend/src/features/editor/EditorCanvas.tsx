"use client";

import { useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Bold, Heading2, ImagePlus, Italic, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorMode } from "./EditorShell";

type EditorCanvasProps = {
  title: string;
  onTitleChange: (value: string) => void;
  content: string;
  onContentChange: (value: string) => void;
  dek?: string;
  onDekChange?: (value: string) => void;
  showDek?: boolean;
  titlePlaceholder?: string;
  dekPlaceholder?: string;
  bodyPlaceholder?: string;
  mode?: EditorMode;
  preview?: React.ReactNode;
  onImageInsert?: () => void;
  className?: string;
};

function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
): { next: string; cursorStart: number; cursorEnd: number } {
  const selected = value.slice(start, end) || "text";
  const next =
    value.slice(0, start) + before + selected + after + value.slice(end);
  return {
    next,
    cursorStart: start + before.length,
    cursorEnd: start + before.length + selected.length,
  };
}

export function EditorCanvas({
  title,
  onTitleChange,
  content,
  onContentChange,
  dek,
  onDekChange,
  showDek = false,
  titlePlaceholder = "Title",
  dekPlaceholder = "Dek / summary",
  bodyPlaceholder = "Write in Markdown…",
  mode = "write",
  preview,
  onImageInsert,
  className,
}: EditorCanvasProps) {
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const applyWrap = (before: string, after: string) => {
    const el = bodyRef.current;
    if (!el) {
      onContentChange(`${content}${before}text${after}`);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const { next, cursorStart, cursorEnd } = wrapSelection(
      content,
      start,
      end,
      before,
      after,
    );
    onContentChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const insertHeading = () => {
    const el = bodyRef.current;
    if (!el) {
      onContentChange(`${content}\n## Heading\n`);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const next =
      content.slice(0, lineStart) + "## " + content.slice(lineStart);
    onContentChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart + 3, lineStart + 3);
    });
  };

  const insertLink = () => {
    applyWrap("[", "](https://)");
  };

  if (mode === "preview" && preview) {
    return (
      <div
        className={cn(
          "min-h-[28rem] border border-border bg-background",
          className,
        )}
      >
        {preview}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-border bg-background",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2">
        <ToolbarButton
          label="Bold"
          onClick={() => applyWrap("**", "**")}
          icon={<Bold className="h-3.5 w-3.5" />}
        />
        <ToolbarButton
          label="Italic"
          onClick={() => applyWrap("*", "*")}
          icon={<Italic className="h-3.5 w-3.5" />}
        />
        <ToolbarButton
          label="Heading"
          onClick={insertHeading}
          icon={<Heading2 className="h-3.5 w-3.5" />}
        />
        <ToolbarButton
          label="Link"
          onClick={insertLink}
          icon={<Link2 className="h-3.5 w-3.5" />}
        />
        {onImageInsert && (
          <ToolbarButton
            label="Image"
            onClick={onImageInsert}
            icon={<ImagePlus className="h-3.5 w-3.5" />}
          />
        )}
      </div>

      <div className="space-y-4 p-5 sm:p-8">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className="w-full bg-transparent font-display text-3xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/50 focus:outline-none sm:text-4xl"
        />

        {showDek && onDekChange && (
          <TextareaAutosize
            value={dek ?? ""}
            onChange={(e) => onDekChange(e.target.value)}
            placeholder={dekPlaceholder}
            minRows={2}
            className="w-full resize-none bg-transparent font-serif text-base leading-relaxed text-muted-foreground placeholder:text-muted-foreground/45 focus:outline-none sm:text-lg"
          />
        )}

        <TextareaAutosize
          ref={bodyRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={bodyPlaceholder}
          minRows={16}
          className="w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/45 focus:outline-none"
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
