import { redirect } from "next/navigation";
import { fetchDashboardInitialData } from "@/features/data/server-queries";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId, posts, stats } = await fetchDashboardInitialData();
  if (!userId) redirect("/auth/signin");
  return <DashboardClient serverSnapshot={{ posts, stats }} />;
}
