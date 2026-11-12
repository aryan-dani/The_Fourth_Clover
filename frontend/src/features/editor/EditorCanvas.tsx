"use client";

import React from "react";
import TextareaAutosize from "react-textarea-autosize";
import { RichEditor } from "./RichEditor";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { cn } from "@/lib/utils";
import type { EditorMode } from "./EditorShell";

export type EditorCanvasProps = {
  title: string;
  onTitleChange: (value: string) => void;
  content: string;
  onContentChange: (value: string) => void;
  onWordCountChange?: (words: number, readTime: number) => void;
  dek?: string;
  onDekChange?: (value: string) => void;
  showDek?: boolean;
  titlePlaceholder?: string;
  dekPlaceholder?: string;
  bodyPlaceholder?: string;
  mode?: EditorMode;
  preview?: React.ReactNode;
  onImageInsert?: () => void;
  storageKey?: string;
  userId?: string | null;
  className?: string;
};

export function EditorCanvas({
  title,
  onTitleChange,
  content,
  onContentChange,
  onWordCountChange,
  dek,
  onDekChange,
  showDek = false,
  titlePlaceholder = "Title",
  dekPlaceholder = "Dek / summary (1–2 sentences)",
  bodyPlaceholder = "Start writing, or type '/' for commands…",
  mode = "write",
  preview,
  storageKey,
  userId,
  className,
}: EditorCanvasProps) {
  if (mode === "preview") {
    if (preview) {
      return (
        <div
          className={cn(
            "min-h-[28rem] rounded-2xl border border-border/80 bg-background shadow-sm",
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
          "min-h-[28rem] rounded-2xl border border-border/80 bg-background p-6 sm:p-12 md:p-16 shadow-sm",
          className,
        )}
      >
        {title && (
          <h1 className="font-display mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {title}
          </h1>
        )}
        {showDek && dek && (
          <p className="font-serif mb-8 text-lg sm:text-xl text-muted-foreground leading-relaxed">
            {dek}
          </p>
        )}
        <PostBodyRenderer content={content} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/80 bg-background shadow-sm transition-colors",
        className,
      )}
    >
      <div className="mx-auto max-w-4xl px-6 sm:px-12 md:px-16 pt-8 pb-12 sm:pt-12">
        {/* Post Headline Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className="font-display w-full bg-transparent text-3xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/35 focus:outline-none sm:text-4xl md:text-[2.75rem] leading-[1.12]"
        />

        {/* Optional Dek / Lead Summary Input */}
        {showDek && onDekChange && (
          <div className="mt-4 pt-2">
            <TextareaAutosize
              value={dek ?? ""}
              onChange={(e) => onDekChange(e.target.value)}
              placeholder={dekPlaceholder}
              minRows={1}
              className="w-full resize-none bg-transparent font-serif text-lg leading-relaxed text-muted-foreground placeholder:text-muted-foreground/40 focus:text-foreground focus:outline-none sm:text-xl"
            />
          </div>
        )}

        {/* Distraction-Free Rich Text Canvas */}
        <div className="mt-6 border-t border-border/30 pt-6">
          <RichEditor
            content={content}
            onChange={onContentChange}
            onWordCountChange={onWordCountChange}
            placeholder={bodyPlaceholder}
            storageKey={storageKey}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
}
