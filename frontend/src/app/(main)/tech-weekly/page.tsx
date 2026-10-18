import type { Metadata } from "next";
import { fetchTechWeeklyLandingData } from "@/features/data/tech-weekly-actions";
import { TechWeeklyClient } from "./tech-weekly-client";

export const metadata: Metadata = {
  title: "CSI Tech Weekly | The Fourth Clover",
  description:
    "Weekly technical articles, tutorials, and system architecture deep-dives written by verified CSI MIT-WPU Technical members.",
};

export const revalidate = 15;

export default async function TechWeeklyPage() {
  const data = await fetchTechWeeklyLandingData();
  return <TechWeeklyClient initialData={data} />;
}
