import React from "react";
import Image from "next/image";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import {
  hasMarkdownSyntax,
  normalizePostContent,
  postContentToBlocks,
  slugifyHeading,
} from "@/lib/post-content";
import { cn } from "@/lib/utils";

type PostBodyRendererProps = {
  content: string | null | undefined;
  forceMarkdown?: boolean;
  className?: string;
};

function isNextImageSupportedUrl(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const parsed = new URL(src);
    if (parsed.protocol !== "https:") return false;
    return (
      parsed.hostname.endsWith(".supabase.co") ||
      parsed.hostname === "miro.medium.com"
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

export function PostBodyRenderer({
  content,
  forceMarkdown = false,
  className,
}: PostBodyRendererProps) {
  if (!content || content.trim().length === 0) {
    return null;
  }

  const useMarkdown = forceMarkdown || hasMarkdownSyntax(content);

  if (!useMarkdown) {
    return (
      <div className={cn("prose prose-lg max-w-none mb-12 font-serif", className)}>
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
      const altText = alt?.trim() || "Post inline illustration";
      const caption = title?.trim() || (alt && alt.trim().length > 0 ? alt.trim() : null);

      return (
        <figure className="my-8">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/30">
            {isNextImageSupportedUrl(src) ? (
              <Image
                src={src}
                alt={altText}
                width={1200}
                height={675}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 85vw, 880px"
                className="h-auto max-h-[72vh] w-full object-contain my-0 border-0"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={altText}
                width={1200}
                height={675}
                loading="lazy"
                decoding="async"
                className="h-auto max-h-[72vh] w-full object-contain my-0 border-0"
              />
            )}
          </div>
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    },
    table({ children }) {
      return (
        <div className="my-6 w-full overflow-x-auto rounded-xl">
          <table className="my-0">{children}</table>
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
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className={cn("prose prose-lg max-w-none mb-12 font-serif", className)}>
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
