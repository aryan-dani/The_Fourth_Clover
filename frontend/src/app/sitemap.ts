import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import {
  listPublishedPostSlugsForSitemap,
  listProfileUsernamesForSitemap,
} from "@/features/data/server-queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/explore"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    {
      url: absoluteUrl("/copyright"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [postRows, profileRows] = await Promise.all([
    listPublishedPostSlugsForSitemap(),
    listProfileUsernamesForSitemap(),
  ]);

  const postEntries: MetadataRoute.Sitemap = postRows.map((p) => ({
    url: absoluteUrl(`/post/${encodeURIComponent(p.slug)}`),
    lastModified: p.updated_at
      ? new Date(p.updated_at)
      : p.published_at
        ? new Date(p.published_at)
        : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const profileEntries: MetadataRoute.Sitemap = profileRows.map((row) => ({
    url: absoluteUrl(`/profile/${encodeURIComponent(row.username)}`),
    lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...postEntries, ...profileEntries];
}
