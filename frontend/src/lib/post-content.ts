/**
 * Post bodies often contain `\r`, `\r\n`, Unicode line/paragraph separators, or
 * invisible marks from Word/Blogspot paste. Those can render as "tofu" boxes.
 *
 * Stripping such characters without inserting a space or newline will join
 * adjacent words (e.g. "hoon.Wohi"). This pipeline always converts "break"
 * semantics to `\n` or a normal space, then collapses runs of spaces per line.
 */

/** Unicode space / space-like separators → U+0020 (before line splitting). */
const UNICODE_SPACE_LIKE =
  /[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g;

export function normalizePostContent(raw: string): string {
  let s = raw.replace(/^\uFEFF/, "");
  // Legacy ZWNBSP / stray BOMs mid-string: use a space so words do not join.
  s = s.replace(/\uFEFF/g, " ");

  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Paragraph / line separators and common “soft break” controls
  s = s
    .replace(/\u2029/g, "\n\n")
    .replace(/\u2028/g, "\n")
    .replace(/\u0085/g, "\n")
    .replace(/\u000B/g, "\n")
    .replace(/\u000C/g, "\n");

  s = s.replace(UNICODE_SPACE_LIKE, " ");
  // Avoid huge gaps if paste mixed PS with blank lines
  s = s.replace(/\n{3,}/g, "\n\n");

  return s;
}

/**
 * Strip / replace control and invisible characters inside a single line.
 * Prefer replacing with a space over deleting so words never glue together.
 */
export function stripInvisibleAndControls(text: string): string {
  return (
    text
      // Zero-width / join controls (common in pasted rich text)
      .replace(/[\u200B-\u200D\u2060]/g, " ")
      // C0 controls except TAB (TAB handled below); use space, not deletion
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
      .replace(/\t/g, " ")
      // C1 controls (NEL is normalized earlier; stray bytes still appear in the wild)
      .replace(/[\u007F-\u009F]/g, " ")
      // Object / replacement glyph - space avoids tofu and avoids joining words
      .replace(/\uFFFC|\uFFFD/g, " ")
      // Bidirectional marks
      .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, " ")
      // Soft hyphen: optional line-break hyphen; omit glyph, do not join syllables oddly
      .replace(/\u00AD/g, "")
  );
}

export function cleanPostLine(rawLine: string): string {
  const cleaned = stripInvisibleAndControls(rawLine);
  return cleaned.replace(/\s+/g, " ").trim();
}

export type PostContentBlock =
  | { kind: "line"; text: string }
  | { kind: "spacer" };

export function postContentToBlocks(raw: string | null | undefined): PostContentBlock[] {
  if (raw == null || raw === "") return [];
  const normalized = normalizePostContent(raw);
  const lines = normalized.split("\n");
  const blocks: PostContentBlock[] = [];

  for (const line of lines) {
    const text = cleanPostLine(line);
    if (text === "") {
      blocks.push({ kind: "spacer" });
    } else {
      blocks.push({ kind: "line", text });
    }
  }

  return blocks;
}

const MARKDOWN_SYNTAX_PATTERNS = [
  /^#{1,6}\s+\S/m,
  /!\[[^\]]*\]\([^)]+\)/,
  /\[[^\]]+\]\([^)]+\)/,
  /```[\s\S]*?```/,
  /`[^`\n]+`/,
  /\*\*[^*\n]+\*\*/,
  /^>\s+\S/m,
  /^[-*+]\s+\S/m,
  /^\d+\.\s+\S/m,
  /^\|.+\|$/m,
];

export function hasMarkdownSyntax(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return MARKDOWN_SYNTAX_PATTERNS.some((pattern) => pattern.test(raw));
}

export function slugifyHeading(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[`*_~[\]()]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "section";
}

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export function extractHeadings(raw: string | null | undefined): TocHeading[] {
  if (!raw) return [];
  const normalized = normalizePostContent(raw);
  const lines = normalized.split("\n");
  const headings: TocHeading[] = [];
  const seenCounts = new Map<string, number>();
  let inCodeFence = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (/^(```|~~~)/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*$/.exec(trimmed);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const cleanText = match[2]
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[`*_~]/g, "")
      .trim();

    if (!cleanText) continue;

    const baseSlug = slugifyHeading(cleanText);
    const count = (seenCounts.get(baseSlug) ?? 0) + 1;
    seenCounts.set(baseSlug, count);
    const id = count === 1 ? baseSlug : `${baseSlug}-${count}`;

    headings.push({ id, text: cleanText, level });
  }

  return headings;
}

