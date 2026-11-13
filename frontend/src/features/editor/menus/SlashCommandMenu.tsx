"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  Code2,
  Calculator,
  Workflow,
  MessageSquare,
  Table as TableIcon,
  Image as ImageIcon,
  Globe,
} from "lucide-react";

export type CommandItem = {
  id: string;
  title: string;
  description: string;
  group: "Basic Blocks" | "Engineering & Math" | "Media & Embeds";
  icon: React.ReactNode;
  action: (editor: Editor) => void;
};

export const COMMAND_ITEMS: CommandItem[] = [
  // Basic Blocks
  {
    id: "text",
    title: "Text",
    description: "Just plain editorial body text",
    group: "Basic Blocks",
    icon: <Type className="h-4 w-4" />,
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: "h1",
    title: "Heading 1",
    description: "Large title heading",
    group: "Basic Blocks",
    icon: <Heading1 className="h-4 w-4" />,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    title: "Heading 2",
    description: "Medium section heading",
    group: "Basic Blocks",
    icon: <Heading2 className="h-4 w-4" />,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    title: "Heading 3",
    description: "Small subsection heading",
    group: "Basic Blocks",
    icon: <Heading3 className="h-4 w-4" />,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bullet-list",
    title: "Bullet List",
    description: "Create an unordered list",
    group: "Basic Blocks",
    icon: <List className="h-4 w-4" />,
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "ordered-list",
    title: "Numbered List",
    description: "Create a sequential list",
    group: "Basic Blocks",
    icon: <ListOrdered className="h-4 w-4" />,
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "task-list",
    title: "Task List",
    description: "Checklist with interactive boxes",
    group: "Basic Blocks",
    icon: <ListTodo className="h-4 w-4" />,
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: "quote",
    title: "Quote",
    description: "Capture a prominent quote or citation",
    group: "Basic Blocks",
    icon: <Quote className="h-4 w-4" />,
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "divider",
    title: "Section Divider",
    description: "Separate sections with a clean rule",
    group: "Basic Blocks",
    icon: <Minus className="h-4 w-4" />,
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },

  // Engineering & Math
  {
    id: "code-block",
    title: "Code Block",
    description: "Syntax highlighted multi-language IDE block",
    group: "Engineering & Math",
    icon: <Code2 className="h-4 w-4 text-emerald-500" />,
    action: (editor) =>
      editor.chain().focus().setCodeBlock({ language: "typescript" }).run(),
  },
  {
    id: "math",
    title: "LaTeX Math Block",
    description: "Mathematical equations rendered via KaTeX",
    group: "Engineering & Math",
    icon: <Calculator className="h-4 w-4 text-purple-500" />,
    action: (editor) => editor.chain().focus().setMathBlock().run(),
  },
  {
    id: "mermaid",
    title: "Mermaid Diagram",
    description: "Flowcharts, sequence and architecture diagrams",
    group: "Engineering & Math",
    icon: <Workflow className="h-4 w-4 text-emerald-500" />,
    action: (editor) => editor.chain().focus().setMermaid().run(),
  },
  {
    id: "callout",
    title: "Callout / Admonition",
    description: "Highlighted box for takeaways, notes or warnings",
    group: "Engineering & Math",
    icon: <MessageSquare className="h-4 w-4 text-sky-500" />,
    action: (editor) => editor.chain().focus().setCallout({ type: "note" }).run(),
  },
  {
    id: "table",
    title: "Table",
    description: "Interactive data and benchmark grid",
    group: "Engineering & Math",
    icon: <TableIcon className="h-4 w-4 text-amber-500" />,
    action: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },

  // Media & Embeds
  {
    id: "image",
    title: "Image / Architecture Diagram",
    description: "Upload a lossless figure or screenshot",
    group: "Media & Embeds",
    icon: <ImageIcon className="h-4 w-4" />,
    action: (editor) => {
      // Trigger file picker
      const input = document.getElementById("hidden-editor-file-input") as HTMLInputElement | null;
      if (input) input.click();
    },
  },
  {
    id: "embed",
    title: "Embed / Web Bookmark",
    description: "Embed YouTube, X, GitHub, ArXiv, or article",
    group: "Media & Embeds",
    icon: <Globe className="h-4 w-4 text-sky-500" />,
    action: (editor) => editor.chain().focus().setEmbed({ url: "" }).run(),
  },
];

type SlashCommandMenuProps = {
  editor: Editor;
};

export function SlashCommandMenu({ editor }: SlashCommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll selected command into view when navigating with Arrow keys
  useEffect(() => {
    if (!isOpen) return;
    if (selectedButtonRef.current) {
      selectedButtonRef.current.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "auto",
      });
    }
  }, [selectedIndex, isOpen]);

  // Monitor editor transactions to detect typing '/'
  useEffect(() => {
    const handleUpdate = () => {
      const { selection } = editor.state;
      const { $from } = selection;

      // Check current text before cursor
      const textBefore = $from.parent.textBetween(
        0,
        $from.parentOffset,
        undefined,
        "\ufffc",
      );

      const slashIndex = textBefore.lastIndexOf("/");

      if (slashIndex !== -1 && (slashIndex === 0 || textBefore[slashIndex - 1] === " ")) {
        const currentQuery = textBefore.slice(slashIndex + 1);
        // Only open if query doesn't contain spaces and is reasonably short
        if (!currentQuery.includes(" ") && currentQuery.length <= 15) {
          setQuery(currentQuery.toLowerCase());
          setIsOpen(true);
          setSelectedIndex(0);

          // Calculate cursor position coordinates
          try {
            const coords = editor.view.coordsAtPos($from.pos);
            const domRect = editor.view.dom.getBoundingClientRect();
            const popoverWidth = 288;
            const maxLeft = Math.max(16, domRect.width - popoverWidth - 16);
            const targetLeft = Math.min(
              Math.max(16, coords.left - domRect.left),
              maxLeft,
            );
            setPosition({
              top: coords.bottom - domRect.top + 8,
              left: targetLeft,
            });
          } catch {
            // Fallback
          }
          return;
        }
      }

      setIsOpen(false);
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  // Filter commands
  const filteredCommands = COMMAND_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query),
  );

  const executeCommand = useCallback(
    (item: CommandItem) => {
      const { selection } = editor.state;
      const { $from } = selection;
      const textBefore = $from.parent.textBetween(
        0,
        $from.parentOffset,
        undefined,
        "\ufffc",
      );
      const slashIndex = textBefore.lastIndexOf("/");

      if (slashIndex !== -1) {
        // Delete the slash and query text
        const startPos = $from.pos - (textBefore.length - slashIndex);
        editor
          .chain()
          .focus()
          .deleteRange({ from: startPos, to: $from.pos })
          .run();
      }

      item.action(editor);
      setIsOpen(false);
    },
    [editor],
  );

  // Key navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, filteredCommands, selectedIndex, executeCommand]);

  if (!isOpen || filteredCommands.length === 0) return null;

  // Group commands
  const groups = Array.from(new Set(filteredCommands.map((c) => c.group)));

  return (
    <div
      ref={menuRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="absolute z-50 max-h-80 w-72 select-none overflow-y-auto border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="mb-1 border-b border-[hsl(var(--border))] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Commands {query ? `· ${query}` : ""}
      </div>

      <div className="space-y-2">
        {groups.map((group) => {
          const itemsInGroup = filteredCommands.filter((c) => c.group === group);
          return (
            <div key={group} className="space-y-0.5">
              <div className="px-2 pb-0.5 pt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
                {group}
              </div>
              {itemsInGroup.map((item) => {
                const itemIndex = filteredCommands.indexOf(item);
                const isSelected = itemIndex === selectedIndex;
                return (
                  <button
                    key={item.id}
                    ref={isSelected ? selectedButtonRef : undefined}
                    type="button"
                    onClick={() => executeCommand(item)}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors ${
                      isSelected
                        ? "bg-[hsl(var(--surface))] text-foreground"
                        : "text-muted-foreground hover:bg-[hsl(var(--surface))] hover:text-foreground"
                    }`}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-[hsl(var(--border))] bg-background">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="truncate text-[11px] font-normal text-muted-foreground/80">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
