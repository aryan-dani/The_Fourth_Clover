import { listRecentPublicationPostsForRss } from "@/features/data/server-queries";
import { absoluteUrl } from "@/lib/site";

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
  const posts = await listRecentPublicationPostsForRss("csi", 50);
  const channelTitle = "CSI MIT-WPU Tech Blog | The Fourth Clover";
  const channelLink = absoluteUrl("/csi");
  const channelDesc =
    "Technical deep-dives, tutorials, and engineering explainers written by CSI MIT-WPU technical members.";

  const items = posts
    .map((p) => {
      const link = absoluteUrl(`/csi/${encodeURIComponent(p.slug)}`);
      const pub = rfc822Date(p.published_at);
      const desc = escapeXml(
        (p.excerpt || p.title || "").trim() ||
          "New technical article on the CSI MIT-WPU Tech Blog.",
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
    <atom:link href="${escapeXml(absoluteUrl("/csi/feed.xml"))}" rel="self" type="application/rss+xml"/>
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
