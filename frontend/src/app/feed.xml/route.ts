import { listRecentPublishedPostsForRss } from "@/features/data/server-queries";
import { siteUrl, absoluteUrl } from "@/lib/site";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822Date(iso: string | null | undefined): string {
  if (!iso) return new Date().toUTCString();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET() {
  const posts = await listRecentPublishedPostsForRss(50);
  const channelTitle = "The Fourth Clover";
  const channelLink = siteUrl;
  const channelDesc =
    "Latest published stories from The Fourth Clover community.";

  const items = posts
    .map((p) => {
      const link = absoluteUrl(`/post/${encodeURIComponent(p.slug)}`);
      const pub = rfc822Date(p.published_at);
      const desc = escapeXml(
        (p.excerpt || p.title || "").trim() || "New post on The Fourth Clover."
      );
      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${desc}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDesc)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
