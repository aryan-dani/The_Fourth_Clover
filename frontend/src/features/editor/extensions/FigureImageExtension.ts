import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FigureImageNodeView } from "./FigureImageNodeView";

export type FigureImageAttributes = {
  src: string;
  alt?: string;
  caption?: string;
  layout?: "default" | "wide" | "full";
  width?: number;
  height?: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figureImage: {
      setFigureImage: (options: FigureImageAttributes) => ReturnType;
    };
  }
}

export const FigureImageExtension = Node.create({
  name: "figureImage",
  group: "block",
  atom: true,
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: "",
      },
      caption: {
        default: "",
      },
      layout: {
        default: "default",
        parseHTML: (element) => element.getAttribute("data-layout") || "default",
        renderHTML: (attributes) => ({
          "data-layout": attributes.layout || "default",
        }),
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-layout]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const img = element.querySelector("img");
          const caption = element.querySelector("figcaption");
          if (!img) return false;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") || "",
            caption: caption ? caption.textContent || "" : "",
            layout: element.getAttribute("data-layout") || "default",
            width: img.getAttribute("width") ? Number(img.getAttribute("width")) : null,
            height: img.getAttribute("height") ? Number(img.getAttribute("height")) : null,
          };
        },
      },
      {
        tag: "figure",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const img = element.querySelector("img");
          const caption = element.querySelector("figcaption");
          if (!img) return false;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") || "",
            caption: caption ? caption.textContent || "" : "",
            layout: "default",
            width: img.getAttribute("width") ? Number(img.getAttribute("width")) : null,
            height: img.getAttribute("height") ? Number(img.getAttribute("height")) : null,
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            src: element.getAttribute("src"),
            alt: element.getAttribute("alt") || "",
            caption: "",
            layout: "default",
            width: element.getAttribute("width") ? Number(element.getAttribute("width")) : null,
            height: element.getAttribute("height") ? Number(element.getAttribute("height")) : null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const layout = HTMLAttributes.layout || "default";
    const layoutClass = `editorial-figure layout-${layout}`;

    const imgAttrs: Record<string, unknown> = {
      src: HTMLAttributes.src,
      alt: HTMLAttributes.alt || "",
      loading: "lazy",
    };
    if (HTMLAttributes.width) imgAttrs.width = HTMLAttributes.width;
    if (HTMLAttributes.height) imgAttrs.height = HTMLAttributes.height;

    const figChildren: unknown[] = [["img", imgAttrs]];

    if (HTMLAttributes.caption && String(HTMLAttributes.caption).trim()) {
      figChildren.push(["figcaption", {}, HTMLAttributes.caption]);
    }

    return [
      "figure",
      mergeAttributes({ "data-layout": layout, class: layoutClass }),
      ...figChildren,
    ];
  },

  addCommands() {
    return {
      setFigureImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureImageNodeView);
  },
});
