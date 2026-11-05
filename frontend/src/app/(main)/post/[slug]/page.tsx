import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPostBySlugForPage } from "@/features/data/server-queries";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { PostPageClient } from "./post-page-client";
import { absoluteUrl } from "@/lib/site";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";

export const revalidate = 60;
export const fetchCache = "force-cache";
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const supabase = createSupabasePublicServerClient();
    const { data } = await supabase
      .from("posts")
      .select("slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100);
    return (data || [])
      .map((row) => row.slug)
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

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
    (post.is_anonymous
      ? "A story on The Fourth Clover."
      : `A story by ${post.author.full_name || post.author.username} on The Fourth Clover.`);

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

  const isCsiPost = Boolean(post.publication_id);
  const postFormat = post.format === "poetry" ? "poetry" : "prose";

  return (
    <PostPageClient
      initialPost={post}
      body={
        <PostBodyRenderer
          content={post.content}
          forceMarkdown={isCsiPost}
          format={postFormat}
        />
      }
    />
  );
}
