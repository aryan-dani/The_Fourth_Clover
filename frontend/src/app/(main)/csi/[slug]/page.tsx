import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchPublicationPostBySlug,
  listRelatedPublicationPosts,
  getPublicationMembers,
} from "@/features/data/server-queries";
import { PostPageClient } from "../../post/[slug]/post-page-client";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublicationPostBySlug("csi", slug);
  if (!post) {
    return {
      title: "Article not found | CSI Tech Blog",
      description:
        "This technical article could not be found on the CSI Tech Blog.",
    };
  }

  const title = `${post.title} | CSI Tech Blog`;
  const description =
    (post.excerpt && post.excerpt.slice(0, 160)) ||
    `A technical article by ${post.author.full_name || post.author.username} on the CSI MIT-WPU Tech Blog.`;

  const ogImage = post.cover_image ? absoluteUrl(post.cover_image) : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/csi/${encodeURIComponent(post.slug)}`),
    },
    openGraph: {
      title: post.title,
      description,
      url: absoluteUrl(`/csi/${encodeURIComponent(post.slug)}`),
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

export default async function CsiPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPublicationPostBySlug("csi", slug);
  if (!post) notFound();

  const [relatedPosts, members] = await Promise.all([
    listRelatedPublicationPosts("csi", post.id, 3),
    getPublicationMembers("csi"),
  ]);

  const authorMember = members.find((m) => m.user_id === post.author_id);
  const editorUserIds = members
    .filter((m) => m.role === "editor")
    .map((m) => m.user_id);

  return (
    <PostPageClient
      initialPost={post}
      publicationSlug="csi"
      publicationName="CSI Tech Blog"
      relatedPosts={relatedPosts}
      authorRole={authorMember?.role ?? null}
      editorUserIds={editorUserIds}
    />
  );
}

