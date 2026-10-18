import type { Metadata } from "next";
import { fetchTechWeeklyReviewQueueData } from "@/features/data/tech-weekly-actions";
import TechWeeklyReviewClient from "./tech-weekly-review-client";

export const metadata: Metadata = {
  title: "Technical Head Curation Queue | CSI Tech Weekly",
  description:
    "Review weekly technical submissions and select the single official CSI MIT-WPU LinkedIn feature post.",
};

export const dynamic = "force-dynamic";

export default async function TechWeeklyReviewPage() {
  const data = await fetchTechWeeklyReviewQueueData();
  return <TechWeeklyReviewClient initialData={data} />;
}
