import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MathNodeView } from "./MathNodeView";

export type MathAttributes = {
  latex: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      setMathBlock: (options?: Partial<MathAttributes>) => ReturnType;
    };
  }
}

export const MathExtension = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      latex: {
        default: "f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi) e^{2 \\pi i \\xi x} d\\xi",
        parseHTML: (element) => element.getAttribute("data-latex") || "",
        renderHTML: (attributes) => ({
          "data-latex": attributes.latex || "",
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-latex]",
      },
      {
        tag: "div.editorial-math-block",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "editorial-math-block",
        "data-latex": HTMLAttributes["data-latex"] || "",
      }),
    ];
  },

  addCommands() {
    return {
      setMathBlock:
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
    return ReactNodeViewRenderer(MathNodeView);
  },
});
