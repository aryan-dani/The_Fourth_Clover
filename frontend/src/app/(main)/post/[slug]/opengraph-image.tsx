import { createOgImage } from "@/lib/og";
import { fetchPostBySlugForPage } from "@/features/data/server-queries";

export const alt = "The Fourth Clover";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PostOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPostBySlugForPage(slug);
  const isPoetry = post?.format === "poetry";

  return createOgImage({
    title: post?.title || "Story",
    sectionLabel: isPoetry ? "Poetry" : "Journal",
  });
}
