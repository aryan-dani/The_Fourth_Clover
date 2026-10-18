import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listPublicationPosts,
  getPublicationMembers,
  getUserPublicationRole,
  listReviewQueue,
} from "@/features/data/server-queries";
import { absoluteUrl } from "@/lib/site";
import { CsiLandingClient } from "./csi-landing-client";

const CSI_PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const { publication } = await listPublicationPosts("csi", 1, 0);
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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ publication, posts, tags, error }, members, roleInfo] =
    await Promise.all([
      listPublicationPosts("csi", CSI_PAGE_SIZE, 0),
      getPublicationMembers("csi"),
      user?.id
        ? getUserPublicationRole("csi", user.id)
        : Promise.resolve({
            role: null,
            publicationId: null,
            publicationName: null,
          }),
    ]);

  let reviewQueueCount = 0;
  if (roleInfo.role === "editor") {
    const queue = await listReviewQueue("csi");
    reviewQueueCount = queue.posts.length;
  }

  const resolvedPublication = publication ?? {
    id: "00000000-0000-0000-0000-000000000c51",
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
      initialTags={tags}
      members={members}
      viewerRole={roleInfo.role}
      reviewQueueCount={reviewQueueCount}
      initialLoadError={error}
      pageSize={CSI_PAGE_SIZE}
      initialHasMore={posts.length === CSI_PAGE_SIZE}
    />
  );
}
