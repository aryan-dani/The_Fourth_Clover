import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { EmbedNodeView } from "./EmbedNodeView";

export type EmbedAttributes = {
  url: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (options?: Partial<EmbedAttributes>) => ReturnType;
    };
  }
}

export const EmbedExtension = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      url: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-embed-url") || "",
        renderHTML: (attributes) => {
          if (!attributes.url) return {};
          return { "data-embed-url": attributes.url };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-embed-url]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "editorial-embed",
        "data-embed-url": HTMLAttributes["data-embed-url"] || "",
      }),
    ];
  },

  addCommands() {
    return {
      setEmbed:
        (options = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView);
  },
});
