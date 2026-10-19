import { createOgImage } from "@/lib/og";
import { fetchTechSubmissionDetailBySlug } from "@/features/data/tech-weekly-actions";

export const alt = "CSI Tech Weekly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TechWeeklyOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { submission } = await fetchTechSubmissionDetailBySlug(slug);

  return createOgImage({
    title: submission?.title || "Tech Weekly",
    sectionLabel: "Tech Weekly",
  });
}
