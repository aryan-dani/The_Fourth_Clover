import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPostBySlugForPage } from "@/features/data/server-queries";
import { PostPageClient } from "./post-page-client";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlugForPage(slug);
  if (!post) {
    return {
      title: "Post not found",
      description: "This story could not be found on The Fourth Clover.",
    };
  }

  const title = `${post.title} | The Fourth Clover`;
  const description =
    (post.excerpt && post.excerpt.slice(0, 160)) ||
    `A story by ${post.author.full_name || post.author.username} on The Fourth Clover.`;

  const ogImage = post.cover_image ? absoluteUrl(post.cover_image) : undefined;

  return {
    title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
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

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPostBySlugForPage(slug);
  if (!post) notFound();
  return <PostPageClient initialPost={post} />;
}
