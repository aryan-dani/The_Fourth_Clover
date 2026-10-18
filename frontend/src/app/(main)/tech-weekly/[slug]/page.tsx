import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchTechSubmissionDetailBySlug } from "@/features/data/tech-weekly-actions";
import { TechSubmissionDetailClient } from "./tech-submission-detail-client";

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
      initialComments={comments}
      initialViewerReactions={viewerReactions}
      allowMemberComments={allowMemberComments}
    />
  );
}
