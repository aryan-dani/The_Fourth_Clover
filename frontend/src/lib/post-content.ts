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
      // Object / replacement glyph — space avoids tofu and avoids joining words
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
