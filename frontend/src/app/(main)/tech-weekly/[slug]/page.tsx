import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { fetchTechSubmissionDetailBySlug } from "@/features/data/tech-weekly-actions";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";
import { TechSubmissionDetailClient } from "./tech-submission-detail-client";

export const revalidate = 60;
export const fetchCache = "force-cache";
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const supabase = createSupabasePublicServerClient();
    const { data } = await supabase
      .from("tech_submissions")
      .select("slug")
      .eq("is_deleted", false)
      .in("status", ["submitted", "approved", "selected", "archived"])
      .order("created_at", { ascending: false })
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
  const { submission } = await fetchTechSubmissionDetailBySlug(slug);
  if (!submission) {
    return {
      title: "Submission Not Found | CSI Tech Weekly",
    };
  }

  return {
    title: `${submission.title} | CSI Tech Weekly`,
    description:
      submission.summary ||
      `Written by ${submission.author?.full_name || submission.author?.username} for CSI Tech Weekly.`,
  };
}

export default async function TechSubmissionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { submission, comments, viewerReactions, allowMemberComments } =
    await fetchTechSubmissionDetailBySlug(slug);

  if (!submission) {
    notFound();
  }

  return (
    <TechSubmissionDetailClient
      submission={submission}
      body={
        <PostBodyRenderer content={submission.content} forceMarkdown />
      }
      initialComments={comments}
      initialViewerReactions={viewerReactions}
      allowMemberComments={allowMemberComments}
    />
  );
}
