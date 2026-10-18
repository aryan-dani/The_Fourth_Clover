import type { Metadata } from "next";
import {
  listPublicationPosts,
  getPublicationMembers,
} from "@/features/data/server-queries";
import { absoluteUrl } from "@/lib/site";
import { CsiLandingClient } from "./csi-landing-client";

const CSI_PAGE_SIZE = 20;

export const revalidate = 15;

export async function generateMetadata(): Promise<Metadata> {
  const { publication } = await listPublicationPosts("csi", CSI_PAGE_SIZE, 0);
  const title = `${publication?.name || "CSI Tech Blog"} | The Fourth Clover`;
  const description =
    publication?.description ||
    "Technical deep-dives, tutorials, and engineering explainers written by CSI MIT-WPU technical members.";
  const ogImage = publication?.cover_image
    ? absoluteUrl(publication.cover_image)
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl("/csi"),
      types: {
        "application/rss+xml": absoluteUrl("/csi/feed.xml"),
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl("/csi"),
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function CsiPage() {
  const [
    { publication, posts, submissions, weeklyPick, tags, error },
    members,
  ] = await Promise.all([
    listPublicationPosts("csi", CSI_PAGE_SIZE, 0),
    getPublicationMembers("csi"),
  ]);

  const resolvedPublication = publication ?? {
    id: "38a1f07f-4ed3-4465-b8fa-9899d69e6ea3",
    slug: "csi",
    name: "CSI Tech Blog",
    description:
      "Technical deep-dives, tutorials, and engineering explainers written by CSI MIT-WPU technical members.",
    cover_image: null,
    created_at: new Date(0).toISOString(),
  };

  return (
    <CsiLandingClient
      publication={resolvedPublication}
      initialPosts={posts}
      initialSubmissions={submissions}
      initialWeeklyPick={weeklyPick}
      initialTags={tags}
      members={members}
      initialLoadError={error}
      pageSize={CSI_PAGE_SIZE}
      initialHasMore={posts.length === CSI_PAGE_SIZE}
    />
  );
}
