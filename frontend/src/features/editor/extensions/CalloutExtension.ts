import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CalloutNodeView, type CalloutType } from "./CalloutNodeView";

export type CalloutAttributes = {
  type: CalloutType;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (options?: Partial<CalloutAttributes>) => ReturnType;
      toggleCallout: (options?: Partial<CalloutAttributes>) => ReturnType;
    };
  }
}

export const CalloutExtension = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "note",
        parseHTML: (element) => element.getAttribute("data-callout-type") || "note",
        renderHTML: (attributes) => ({
          "data-callout-type": attributes.type || "note",
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "aside[data-callout-type]",
      },
      {
        tag: "div[data-callout-type]",
      },
      {
        tag: "blockquote[data-callout-type]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const type = HTMLAttributes["data-callout-type"] || "note";
    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        class: `editorial-callout callout-${type}`,
        "data-callout-type": type,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (options = {}) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, {
            type: options.type || "note",
          });
        },
      toggleCallout:
        (options = {}) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, {
            type: options.type || "note",
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView);
  },
});
