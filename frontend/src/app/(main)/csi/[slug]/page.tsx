import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchPublicationPostBySlug,
  listRelatedPublicationPosts,
  getUserPublicationRole,
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [relatedPosts, authorRoleInfo, viewerRoleInfo] = await Promise.all([
    listRelatedPublicationPosts("csi", post.id, 3),
    getUserPublicationRole("csi", post.author_id),
    user?.id
      ? getUserPublicationRole("csi", user.id)
      : Promise.resolve({
          role: null,
          publicationId: null,
          publicationName: null,
        }),
  ]);

  return (
    <PostPageClient
      initialPost={post}
      publicationSlug="csi"
      publicationName="CSI Tech Blog"
      relatedPosts={relatedPosts}
      authorRole={authorRoleInfo.role}
      viewerRole={viewerRoleInfo.role}
    />
  );
}
