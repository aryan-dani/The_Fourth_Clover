"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import Focus from "@tiptap/extension-focus";
import { FloatingMenu as FloatingMenuExtension } from "@tiptap/extension-floating-menu";
import { BubbleMenu as BubbleMenuExtension } from "@tiptap/extension-bubble-menu";

import { CodeBlockExtension } from "./extensions/CodeBlockExtension";
import { FigureImageExtension } from "./extensions/FigureImageExtension";
import { EmbedExtension } from "./extensions/EmbedExtension";
import { CalloutExtension } from "./extensions/CalloutExtension";
import { MathExtension } from "./extensions/MathExtension";
import { MermaidExtension } from "./extensions/MermaidExtension";

import { FloatingGutterMenu } from "./menus/FloatingGutterMenu";
import { SelectionBubbleMenu } from "./menus/SelectionBubbleMenu";
import { SlashCommandMenu } from "./menus/SlashCommandMenu";
import { uploadLosslessPostImage } from "./lib/upload-media";
import { hasMarkdownSyntax } from "@/lib/post-content";

import { marked } from "marked";
import TurndownService from "turndown";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Upload,
  Check,
  Sparkles,
} from "lucide-react";

export type RichEditorProps = {
  content: string;
  onChange: (html: string) => void;
  onWordCountChange?: (words: number, readTime: number) => void;
  placeholder?: string;
  storageKey?: string;
  userId?: string | null;
  className?: string;
  readOnly?: boolean;
};

function normalizeInitialContent(raw: string): string {
  if (!raw || !raw.trim()) return "<p></p>";
  const trimmed = raw.trim();
  // If it's already HTML
  if (trimmed.startsWith("<") && (trimmed.includes("<p>") || trimmed.includes("<h2>") || trimmed.includes("<pre>"))) {
    return raw;
  }
  // If it's markdown or plaintext, parse with marked
  try {
    const parsed = marked.parse(raw);
    if (typeof parsed === "string") return parsed;
    return raw;
  } catch {
    return `<p>${raw.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
  }
}

export function RichEditor({
  content,
  onChange,
  onWordCountChange,
  placeholder = "Start writing, or type '/' for commands…",
  storageKey,
  userId,
  className = "",
  readOnly = false,
}: RichEditorProps) {
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [isCopiedMarkdown, setIsCopiedMarkdown] = useState(false);
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const lastEmittedHtmlRef = useRef<string>("");

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    content: normalizeInitialContent(content),
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        dropcursor: {
          color: "var(--brand-color)",
          width: 2,
        },
      }),
      CodeBlockExtension,
      FigureImageExtension,
      EmbedExtension,
      CalloutExtension,
      MathExtension,
      MermaidExtension,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
          class: "link-u text-brand hover:text-brand-bright transition-colors",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Typography,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Subscript,
      Superscript,
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: "editorial-table my-6 w-full border-collapse border border-border text-sm",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list space-y-1.5 my-4 list-none pl-0",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "task-item flex items-start gap-2",
        },
      }),
      CharacterCount,
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
      FloatingMenuExtension,
      BubbleMenuExtension,
    ],
    editorProps: {
      attributes: {
        class:
          "editorial-canvas prose-editorial focus:outline-none min-h-[60vh] max-w-[68ch] mx-auto py-4 text-foreground/90 font-serif text-[18px] sm:text-[19px] leading-[1.82]",
      },
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          const imageFiles = Array.from(files).filter((f) =>
            f.type.startsWith("image/"),
          );
          if (imageFiles.length > 0) {
            event.preventDefault();
            void (async () => {
              for (const file of imageFiles) {
                const uploaded = await uploadLosslessPostImage(file, { userId });
                if (uploaded && editor) {
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
            })();
            return true;
          }
        }

        const text = event.clipboardData?.getData("text/plain");
        if (text && !editor?.isActive("codeBlock") && hasMarkdownSyntax(text)) {
          event.preventDefault();
          try {
            const html = marked.parse(text);
            if (typeof html === "string" && editor) {
              editor.commands.insertContent(html);
              return true;
            }
          } catch {
            // Fall back to standard paste
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          const imageFiles = Array.from(files).filter((f) =>
            f.type.startsWith("image/"),
          );
          if (imageFiles.length > 0) {
            event.preventDefault();
            void (async () => {
              for (const file of imageFiles) {
                const uploaded = await uploadLosslessPostImage(file, { userId });
                if (uploaded && editor) {
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
            })();
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmittedHtmlRef.current = html;
      onChange(html);

      // Word count computation
      const words = ed.storage.characterCount.words();
      const readTime = Math.max(1, Math.ceil(words / 200));
      onWordCountChange?.(words, readTime);
    },
  });

  // Keep editor content in sync when external content prop changes meaningfully
  useEffect(() => {
    if (!editor) return;
    if (content === lastEmittedHtmlRef.current) return;
    if (content.trim() === "" && editor.isEmpty) return;

    const normalized = normalizeInitialContent(content);
    const currentHtml = editor.getHTML();
    if (normalized !== currentHtml) {
      editor.commands.setContent(normalized, { emitUpdate: false });
    }
  }, [content, editor]);

  // Debounced local storage auto-save
  useEffect(() => {
    if (!storageKey || !editor) return;

    const timer = setTimeout(() => {
      try {
        const html = editor.getHTML();
        if (html && html !== "<p></p>") {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              html,
              updatedAt: Date.now(),
            }),
          );
          const timeStr = new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          });
          setDraftSavedTime(timeStr);
        }
      } catch {
        // Ignore quota
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [storageKey, editor]);

  // "Copy as Markdown" feature
  const handleCopyMarkdown = useCallback(async () => {
    if (!editor) return;
    try {
      const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
      });
      // Preserve tables
      turndownService.keep(["table", "tbody", "thead", "tr", "th", "td"]);

      const html = editor.getHTML();
      const md = turndownService.turndown(html);
      await navigator.clipboard.writeText(md);
      setIsCopiedMarkdown(true);
      toast.success("Article copied as Markdown to clipboard!");
      setTimeout(() => setIsCopiedMarkdown(false), 2000);
    } catch (err) {
      console.error("Markdown copy failed:", err);
      toast.error("Could not convert to Markdown.");
    }
  }, [editor]);

  // "Import Markdown" feature
  const handleImportMarkdownFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawText = event.target?.result;
        if (typeof rawText === "string") {
          try {
            const html = marked.parse(rawText) as string;
            editor.commands.setContent(html);
            toast.success("Markdown file imported successfully!");
          } catch {
            toast.error("Could not parse Markdown file.");
          }
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [editor],
  );

  const handleHiddenFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editor) return;
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
    e.target.value = "";
  };

  if (!editor) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`rich-editor-wrapper relative ${className}`}>
      {/* Hidden file input for slash command & toolbar triggers */}
      <input
        id="hidden-editor-file-input"
        ref={hiddenFileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleHiddenFileInputChange}
        className="hidden"
      />

      <input
        ref={importFileInputRef}
        type="file"
        accept=".md,.markdown,text/plain"
        onChange={handleImportMarkdownFile}
        className="hidden"
      />

      {/* Floating Menus */}
      <FloatingGutterMenu editor={editor} userId={userId} />
      <SelectionBubbleMenu editor={editor} />
      <SlashCommandMenu editor={editor} />

      {/* Tiptap Canvas */}
      <EditorContent editor={editor} />

      {/* Minimal Bottom Status Bar with Markdown Export / Import */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4 font-mono text-[11px] text-muted-foreground select-none">
        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            {editor.storage.characterCount.words()} words
          </span>
          <span className="text-border">·</span>
          <span className="tabular-nums">
            ~{Math.max(1, Math.ceil(editor.storage.characterCount.words() / 200))} min read
          </span>
          {draftSavedTime && (
            <>
              <span className="text-border">·</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Draft saved {draftSavedTime}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
            title="Copy article as clean Markdown"
          >
            {isCopiedMarkdown ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>Copy Markdown</span>
          </button>

          <button
            type="button"
            onClick={() => importFileInputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
            title="Import an existing .md file"
          >
            <Upload className="h-3 w-3" />
            <span>Import .md</span>
          </button>
        </div>
      </div>
    </div>
  );
}
