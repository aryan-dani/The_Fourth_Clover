import type { Metadata } from "next";
import { fetchSuperAdminDashboardData } from "@/features/data/admin-actions";
import AdminClient from "./admin-client";

export const metadata: Metadata = {
  title: "Super Admin Command Center | The Fourth Clover",
  description:
    "Manage CSI roster identities, weekly LinkedIn picks, platform settings, moderation, and audit logs.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await fetchSuperAdminDashboardData();
  return <AdminClient initialData={data} />;
}
