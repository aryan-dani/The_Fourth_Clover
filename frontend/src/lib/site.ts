/** Canonical site origin for metadata, OG URLs, and absolute links. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://fourthclover.bio"
).replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${p}`;
}
