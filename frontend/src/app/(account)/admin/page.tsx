import type { Metadata } from "next";
import { fetchSuperAdminDashboardData } from "@/features/data/admin-actions";
import AdminClient from "./admin-client";

export const metadata: Metadata = {
  title: "Admin · Roster and moderation",
  description:
    "CSI roster, identity links, Tech Weekly picks, anonymous Journal approvals, and reports.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await fetchSuperAdminDashboardData();
  return <AdminClient initialData={data} />;
}
