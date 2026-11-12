import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockComponent } from "./CodeBlockComponent";
import { lowlight } from "./lowlight-languages";

export const CodeBlockExtension = CodeBlockLowlight.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      lowlight,
      defaultLanguage: "typescript",
    } as any;
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: "typescript",
        parseHTML: (element) => {
          const langClass = Array.from(element.classList).find((c) =>
            c.startsWith("language-"),
          );
          return (
            element.getAttribute("data-language") ||
            (langClass ? langClass.replace("language-", "") : "typescript")
          );
        },
        renderHTML: (attributes) => ({
          "data-language": attributes.language || "typescript",
          class: `language-${attributes.language || "typescript"}`,
        }),
      },
      filename: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-filename"),
        renderHTML: (attributes) => {
          if (!attributes.filename) return {};
          return { "data-filename": attributes.filename };
        },
      },
      showLineNumbers: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-line-numbers") === "true",
        renderHTML: (attributes) => {
          if (!attributes.showLineNumbers) return {};
          return { "data-line-numbers": "true" };
        },
      },
      wordWrap: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-word-wrap") === "true",
        renderHTML: (attributes) => {
          if (!attributes.wordWrap) return {};
          return { "data-word-wrap": "true" };
        },
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Tab: ({ editor }) => {
        if (editor.isActive("codeBlock")) {
          return editor.commands.insertContent("  ");
        }
        return false;
      },
      "Shift-Tab": ({ editor }) => {
        if (editor.isActive("codeBlock")) {
          // Dedent could be handled or prevent default
          return true;
        }
        return false;
      },
      "Mod-Enter": ({ editor }) => {
        if (editor.isActive("codeBlock")) {
          return editor.commands.exitCode();
        }
        return false;
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});
