import type { Metadata } from "next";
import { fetchTechWeeklyLandingData } from "@/features/data/tech-weekly-actions";
import { TechWeeklyClient } from "./tech-weekly-client";

export const metadata: Metadata = {
  title: "CSI Tech Weekly | The Fourth Clover",
  description:
    "Weekly technical articles, tutorials, and system architecture deep-dives written by verified CSI MIT-WPU members.",
};

export const revalidate = 60;
export const dynamic = "force-static";
export const fetchCache = "force-cache";

export default async function TechWeeklyPage() {
  const data = await fetchTechWeeklyLandingData();
  return <TechWeeklyClient initialData={data} />;
}
