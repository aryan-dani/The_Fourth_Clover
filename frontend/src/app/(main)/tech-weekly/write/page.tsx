import type { Metadata } from "next";
import { fetchTechWeeklyWriteContext } from "@/features/data/tech-weekly-actions";
import TechWeeklyWriteClient from "./tech-weekly-write-client";

export const metadata: Metadata = {
  title: "Write for CSI Tech Weekly | The Fourth Clover",
  description:
    "Draft and submit your weekly technical explainer or engineering deep-dive for CSI MIT-WPU Tech Weekly.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string; edit?: string; new?: string }>;
};

export default async function TechWeeklyWritePage({ searchParams }: Props) {
  const resolved = await searchParams;
  const submissionId = resolved?.id || resolved?.edit || null;
  const context = await fetchTechWeeklyWriteContext(submissionId);

  // If ?new=1 is passed, allow starting a fresh draft if within posts_per_week limit
  const initialContext =
    resolved?.new === "1"
      ? { ...context, editingSubmission: null }
      : context;

  return <TechWeeklyWriteClient initialContext={initialContext} />;
}
