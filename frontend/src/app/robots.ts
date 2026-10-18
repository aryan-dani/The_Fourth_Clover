import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/dashboard",
        "/settings",
        "/admin",
        "/notifications",
        "/write",
        "/csi/write",
        "/csi/review",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
