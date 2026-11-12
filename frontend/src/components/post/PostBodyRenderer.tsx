"use client";

import React, { useEffect, useState, useMemo, useId } from "react";
import Image from "next/image";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import katex from "katex";
import mermaid from "mermaid";
import {
  hasMarkdownSyntax,
  normalizePostContent,
  postContentToBlocks,
  slugifyHeading,
  stripInvisibleAndControls,
} from "@/lib/post-content";
import { CopyCodeButton } from "./CopyCodeButton";
import { ImageLightbox } from "./ImageLightbox";
import { cn } from "@/lib/utils";
import {
  Info,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Globe,
  FileText,
  ExternalLink,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons/BrandIcons";

type PostBodyFormat = "prose" | "poetry";

type PostBodyRendererProps = {
  content: string | null | undefined;
  forceMarkdown?: boolean;
  format?: PostBodyFormat;
  className?: string;
};

function cleanPoetryLine(line: string): string {
  return stripInvisibleAndControls(line).replace(/[ \t]+$/g, "");
}

function renderPoetryBody(content: string, className?: string) {
  const normalized = normalizePostContent(content);
  const stanzas = normalized
    .split(/\n\s*\n/)
    .map((stanza) => stanza.replace(/^\n+|\n+$/g, ""))
    .filter((stanza) => stanza.length > 0);

  return (
    <div className={cn("verse mb-12", className)}>
      {stanzas.map((stanza, index) => (
        <div key={`stanza-${index}`} className="stanza">
          {stanza.split("\n").map((line, lineIndex) => {
            const text = cleanPoetryLine(line);
            return (
              <p key={`line-${index}-${lineIndex}`}>
                {text.length > 0 ? text : "\u00A0"}
              </p>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function isNextImageSupportedUrl(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const parsed = new URL(src);
    if (parsed.protocol !== "https:") return false;
    return (
      parsed.hostname.endsWith(".supabase.co") ||
      parsed.hostname === "miro.medium.com" ||
      parsed.hostname.endsWith("unsplash.com")
    );
  } catch {
    return false;
  }
}

function extractNodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractNodeText).join("");
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractNodeText(node.props.children);
  }
  return "";
}

function isHtmlContent(raw: string): boolean {
  const trimmed = raw.trimStart();
  return (
    trimmed.startsWith("<") &&
    (trimmed.includes("<p>") ||
      trimmed.includes("<h") ||
      trimmed.includes("<pre") ||
      trimmed.includes("<figure") ||
      trimmed.includes("<aside") ||
      trimmed.includes("<div") ||
      trimmed.includes("<ul") ||
      trimmed.includes("<ol") ||
      trimmed.includes("<table"))
  );
}

// Client Component to render a single Mermaid diagram in HTML mode
function MermaidBlock({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const rawId = useId().replace(/:/g, "");
  const diagramId = `mermaid-render-${rawId}`;

  useEffect(() => {
    let active = true;
    const render = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "var(--font-mono)",
        });
        const { svg: out } = await mermaid.render(diagramId, code);
        if (active) {
          setSvg(out);
          setError(null);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Diagram rendering error");
        }
      }
    };
    void render();
    return () => {
      active = false;
    };
  }, [code, diagramId]);

  if (error) {
    return (
      <div className="my-6 rounded-xl border border-border/80 bg-[#0d1117] p-4 text-xs font-mono text-muted-foreground">
        <p className="font-semibold text-rose-400">Mermaid Diagram Error</p>
        <pre className="mt-2 text-zinc-400 overflow-x-auto">{code}</pre>
      </div>
    );
  }

  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-border/80 bg-[#0d1117] p-6 text-center">
      <div
        className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

// Client Component to render a KaTeX math block in HTML mode
function MathBlock({ latex }: { latex: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, { displayMode: true, throwOnError: false });
    } catch {
      return `<span class="font-mono text-xs text-rose-400">${latex}</span>`;
    }
  }, [latex]);

  return (
    <div
      className="my-6 overflow-x-auto rounded-xl border border-border/60 bg-muted/20 py-4 px-6 text-center"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Client Component for Callout in HTML mode
function CalloutBox({
  type = "note",
  children,
}: {
  type?: string;
  children: React.ReactNode;
}) {
  const config = {
    note: {
      icon: <Info className="h-4 w-4 text-sky-500" />,
      border: "border-sky-500/40",
      bg: "bg-sky-500/5",
      title: "Note",
      titleColor: "text-sky-700 dark:text-sky-300",
    },
    mechanism: {
      icon: <Lightbulb className="h-4 w-4 text-emerald-500" />,
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/5",
      title: "Mechanism / Key Idea",
      titleColor: "text-emerald-700 dark:text-emerald-300",
    },
    takeaway: {
      icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      border: "border-purple-500/40",
      bg: "bg-purple-500/5",
      title: "Production Takeaway",
      titleColor: "text-purple-700 dark:text-purple-300",
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      border: "border-amber-500/40",
      bg: "bg-amber-500/5",
      title: "Warning",
      titleColor: "text-amber-700 dark:text-amber-300",
    },
    security: {
      icon: <ShieldAlert className="h-4 w-4 text-rose-500" />,
      border: "border-rose-500/40",
      bg: "bg-rose-500/5",
      title: "Security Advisory",
      titleColor: "text-rose-700 dark:text-rose-300",
    },
  }[type] || {
    icon: <Info className="h-4 w-4 text-sky-500" />,
    border: "border-sky-500/40",
    bg: "bg-sky-500/5",
    title: "Note",
    titleColor: "text-sky-700 dark:text-sky-300",
  };

  return (
    <aside
      className={cn(
        "my-6 rounded-xl border-l-4 border p-4 font-sans text-sm leading-relaxed",
        config.border,
        config.bg,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {config.icon}
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            config.titleColor,
          )}
        >
          {config.title}
        </span>
      </div>
      <div className="space-y-2 text-foreground/90">{children}</div>
    </aside>
  );
}

// Client Component for Embeds in HTML mode
function EmbedCard({ url }: { url: string }) {
  const youtubeMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
  );
  if (youtubeMatch) {
    return (
      <div className="my-8 aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-black shadow-md">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}`}
          title="Embedded video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  const isGithub = /github\.com\//i.test(url);
  const isTwitter = /(twitter|x)\.com\//i.test(url);
  const isArxiv = /arxiv\.org\//i.test(url);

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border/80 bg-card p-4 transition-colors hover:border-brand/60 hover:bg-muted/30">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start justify-between gap-4 group"
      >
        <span className="block min-w-0 flex-1 space-y-1">
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {isGithub ? (
              <>
                <GitHubIcon className="h-3.5 w-3.5" />
                <span>GitHub Repository</span>
              </>
            ) : isTwitter ? (
              <>
                <span className="font-bold">𝕏</span>
                <span>Post / Thread</span>
              </>
            ) : isArxiv ? (
              <>
                <FileText className="h-3.5 w-3.5" />
                <span>ArXiv Paper</span>
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5" />
                <span>Web Reference</span>
              </>
            )}
          </span>
          <span className="block font-sans text-sm font-semibold text-foreground truncate group-hover:text-brand transition-colors">
            {url}
          </span>
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground pt-1 transition-colors" />
      </a>
    </div>
  );
}

export function PostBodyRenderer({
  content,
  forceMarkdown = false,
  format = "prose",
  className,
}: PostBodyRendererProps) {
  if (!content || content.trim().length === 0) {
    return null;
  }

  if (format === "poetry") {
    return renderPoetryBody(content, className);
  }

  const isHtml = isHtmlContent(content) && !forceMarkdown;
  const useMarkdown = !isHtml && (forceMarkdown || hasMarkdownSyntax(content));

  // If plain text (no markdown, not HTML)
  if (!isHtml && !useMarkdown) {
    return (
      <div className={cn("prose-editorial mb-12", className)}>
        {postContentToBlocks(content).map((block, index) =>
          block.kind === "spacer" ? (
            <div key={`s-${index}`} className="h-4 sm:h-5" aria-hidden />
          ) : (
            <p
              key={`p-${index}`}
              className="mb-3 leading-relaxed text-lg text-muted-foreground content md:text-xl sm:mb-4"
            >
              {block.text}
            </p>
          ),
        )}
      </div>
    );
  }

  // 1. Markdown path: enhanced with CopyCodeButton and ImageLightbox
  if (useMarkdown) {
    const normalized = normalizePostContent(content);
    const seenHeadingSlugs = new Map<string, number>();

    const nextHeadingId = (children: React.ReactNode): string => {
      const rawText = extractNodeText(children).trim();
      const baseSlug = slugifyHeading(rawText);
      const count = (seenHeadingSlugs.get(baseSlug) ?? 0) + 1;
      seenHeadingSlugs.set(baseSlug, count);
      return count === 1 ? baseSlug : `${baseSlug}-${count}`;
    };

    const components: Components = {
      h2({ children }) {
        const id = nextHeadingId(children);
        return <h2 id={id}>{children}</h2>;
      },
      h3({ children }) {
        const id = nextHeadingId(children);
        return <h3 id={id}>{children}</h3>;
      },
      p({ children, node }) {
        const hasImageChild = node?.children?.some(
          (child) => child.type === "element" && child.tagName === "img",
        );
        if (hasImageChild) {
          return <div className="my-6">{children}</div>;
        }
        return <p>{children}</p>;
      },
      img({ src, alt, title }) {
        if (!src || typeof src !== "string") return null;
        const altText = alt?.trim() || "Post illustration";
        const caption = title?.trim() || (alt && alt.trim().length > 0 ? alt.trim() : null);

        const imgElement = isNextImageSupportedUrl(src) ? (
          <Image
            src={src}
            alt={altText}
            width={1400}
            height={800}
            unoptimized
            className="h-auto max-h-[78vh] w-full object-contain my-0 border-0"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={altText}
            width={1400}
            height={800}
            loading="lazy"
            decoding="async"
            className="h-auto max-h-[78vh] w-full object-contain my-0 border-0"
          />
        );

        return (
          <figure className="my-8">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
              <ImageLightbox src={src} alt={altText} caption={caption}>
                {imgElement}
              </ImageLightbox>
            </div>
            {caption && <figcaption className="mt-2 text-center font-serif text-sm italic text-muted-foreground">{caption}</figcaption>}
          </figure>
        );
      },
      pre({ children, node }) {
        // Extract raw code string
        const codeText = extractNodeText(children);
        return (
          <div className="relative my-6 overflow-hidden rounded-xl border border-border/80 bg-[#0d1117] text-[#e6edf3] shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#161b22] px-3 py-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
              </div>
              <CopyCodeButton code={codeText} />
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">{children}</pre>
          </div>
        );
      },
      table({ children }) {
        return (
          <div className="my-6 w-full overflow-x-auto rounded-xl border border-border">
            <table className="my-0 w-full border-collapse text-sm">{children}</table>
          </div>
        );
      },
      a({ href, children }) {
        const isExternal =
          typeof href === "string" &&
          (href.startsWith("http://") || href.startsWith("https://"));
        return (
          <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="link-u text-brand hover:text-brand-bright"
          >
            {children}
          </a>
        );
      },
    };

    return (
      <div className={cn("prose-editorial mb-12", className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize, rehypeHighlight]}
          components={components}
        >
          {normalized}
        </ReactMarkdown>
      </div>
    );
  }

  // 2. Rich Tiptap HTML Path
  return (
    <HtmlBodyRenderer content={content} className={className} />
  );
}

// Client Component to render Tiptap-generated HTML with full interactivity
function HtmlBodyRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Client hydration: attach CopyCodeButtons, KaTeX renders, Mermaid diagrams, and Lightboxes
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    // 1. Hydrate pre code blocks with Copy buttons
    const preBlocks = el.querySelectorAll("pre");
    preBlocks.forEach((pre) => {
      if (pre.getAttribute("data-hydrated") === "true") return;
      pre.setAttribute("data-hydrated", "true");

      const code = pre.querySelector("code")?.textContent || pre.textContent || "";
      const lang = pre.getAttribute("data-language") || "code";
      const filename = pre.getAttribute("data-filename") || "";

      // Create IDE header if not present
      if (!pre.previousElementSibling?.classList.contains("code-header-bar")) {
        const header = document.createElement("div");
        header.className =
          "code-header-bar flex items-center justify-between border-b border-white/10 bg-[#161b22] px-3 py-1.5 text-xs select-none";

        const leftGroup = document.createElement("div");
        leftGroup.className = "flex items-center gap-2";

        const dots = document.createElement("div");
        dots.className = "flex items-center gap-1.5 pr-1";
        dots.innerHTML = `
          <span class="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80"></span>
          <span class="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80"></span>
          <span class="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80"></span>
        `;
        leftGroup.appendChild(dots);

        const langBadge = document.createElement("span");
        langBadge.className =
          "rounded bg-[#21262d] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-zinc-300";
        langBadge.textContent = lang;
        leftGroup.appendChild(langBadge);

        if (filename) {
          const fnBadge = document.createElement("span");
          fnBadge.className = "font-mono text-[11px] text-zinc-400";
          fnBadge.textContent = filename;
          leftGroup.appendChild(fnBadge);
        }

        const copyBtn = document.createElement("button");
        copyBtn.className =
          "copy-btn inline-flex items-center gap-1 rounded bg-[#21262d] px-2 py-1 font-mono text-[11px] text-zinc-300 transition-colors hover:bg-[#30363d] hover:text-white";
        copyBtn.textContent = "Copy";
        copyBtn.onclick = async () => {
          await navigator.clipboard.writeText(code);
          copyBtn.textContent = "Copied!";
          copyBtn.classList.add("text-emerald-400");
          setTimeout(() => {
            copyBtn.textContent = "Copy";
            copyBtn.classList.remove("text-emerald-400");
          }, 2000);
        };

        header.appendChild(leftGroup);
        header.appendChild(copyBtn);

        // Wrap pre and header into styled container
        const wrapper = document.createElement("div");
        wrapper.className =
          "relative my-6 overflow-hidden rounded-xl border border-border/80 bg-[#0d1117] text-[#e6edf3] shadow-sm";
        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
      }
    });

    // 2. Hydrate KaTeX blocks
    const mathNodes = el.querySelectorAll<HTMLElement>("[data-latex]");
    mathNodes.forEach((node) => {
      if (node.getAttribute("data-math-hydrated") === "true") return;
      node.setAttribute("data-math-hydrated", "true");
      const formula = node.getAttribute("data-latex") || "";
      try {
        const rendered = katex.renderToString(formula, {
          displayMode: true,
          throwOnError: false,
        });
        node.innerHTML = rendered;
      } catch {
        // Fallback
      }
    });

    // 3. Hydrate Mermaid blocks
    const mermaidNodes = el.querySelectorAll<HTMLElement>("[data-mermaid]");
    mermaidNodes.forEach(async (node, idx) => {
      if (node.getAttribute("data-mermaid-hydrated") === "true") return;
      node.setAttribute("data-mermaid-hydrated", "true");
      const chartCode = node.getAttribute("data-mermaid") || "";
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "var(--font-mono)",
        });
        const id = `rendered-mermaid-${Date.now()}-${idx}`;
        const { svg } = await mermaid.render(id, chartCode);
        node.innerHTML = svg;
      } catch (err: unknown) {
        node.innerHTML = `<div class="p-3 text-xs font-mono text-rose-400">Mermaid diagram error</div>`;
      }
    });

    // 4. Attach click-to-zoom on figure images
    const figureImgs = el.querySelectorAll<HTMLImageElement>("figure img");
    figureImgs.forEach((img) => {
      img.style.cursor = "zoom-in";
      img.title = "Click to inspect full resolution";
      img.onclick = () => {
        // Dispatch lightbox event or open full image
        window.open(img.src, "_blank");
      };
    });
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "prose-editorial tiptap-html-renderer mb-12",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
