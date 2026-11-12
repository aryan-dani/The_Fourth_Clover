import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MermaidNodeView } from "./MermaidNodeView";

export type MermaidAttributes = {
  code: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mermaid: {
      setMermaid: (options?: Partial<MermaidAttributes>) => ReturnType;
    };
  }
}

export const MermaidExtension = Node.create({
  name: "mermaid",
  group: "block",
  atom: true,
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      code: {
        default: `graph TD\n  Client[Client Layer] --> API[API Gateway]\n  API --> Service[Microservice]\n  Service --> DB[(Database)]`,
        parseHTML: (element) => element.getAttribute("data-mermaid") || element.textContent || "",
        renderHTML: (attributes) => ({
          "data-mermaid": attributes.code || "",
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-mermaid]",
      },
      {
        tag: "pre.mermaid",
      },
      {
        tag: "div.editorial-mermaid-block",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "editorial-mermaid-block",
        "data-mermaid": HTMLAttributes["data-mermaid"] || "",
      }),
    ];
  },

  addCommands() {
    return {
      setMermaid:
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
    return ReactNodeViewRenderer(MermaidNodeView);
  },
});
