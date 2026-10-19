import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import {
  listPublishedPostSlugsForSitemap,
  listProfileUsernamesForSitemap,
} from "@/features/data/server-queries";
import {
  listPopularTagSlugsForSitemap,
  listTechSubmissionSlugsForSitemap,
} from "@/features/data/discovery-queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/journal"), changeFrequency: "daily", priority: 0.9 },
    {
      url: absoluteUrl("/tech-weekly"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/tech-weekly/issues"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: absoluteUrl("/tags"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/search"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    {
      url: absoluteUrl("/copyright"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [postRows, profileRows, techRows, tagSlugs] = await Promise.all([
    listPublishedPostSlugsForSitemap(),
    listProfileUsernamesForSitemap(),
    listTechSubmissionSlugsForSitemap(),
    listPopularTagSlugsForSitemap(80),
  ]);

  const postEntries: MetadataRoute.Sitemap = postRows.map((p) => {
    const routePrefix = p.publication_slug === "csi" ? "/csi" : "/post";
    return {
      url: absoluteUrl(`${routePrefix}/${encodeURIComponent(p.slug)}`),
      lastModified: p.updated_at
        ? new Date(p.updated_at)
        : p.published_at
          ? new Date(p.published_at)
          : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  const techEntries: MetadataRoute.Sitemap = techRows.map((row) => ({
    url: absoluteUrl(`/tech-weekly/${encodeURIComponent(row.slug)}`),
    lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const tagEntries: MetadataRoute.Sitemap = tagSlugs.map((tag) => ({
    url: absoluteUrl(`/tags/${encodeURIComponent(tag)}`),
    changeFrequency: "weekly",
    priority: 0.55,
  }));

  const profileEntries: MetadataRoute.Sitemap = profileRows.map((row) => ({
    url: absoluteUrl(`/profile/${encodeURIComponent(row.username)}`),
    lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...postEntries,
    ...techEntries,
    ...tagEntries,
    ...profileEntries,
  ];
}
