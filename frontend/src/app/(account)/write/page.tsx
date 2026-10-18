import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPublicationRole } from "@/features/data/server-queries";
import { WriteClient } from "./write-client";

export const dynamic = "force-dynamic";

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ publication?: string; edit?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const params = await searchParams;
  if (params.publication === "csi") {
    const query = params.edit ? `?edit=${encodeURIComponent(params.edit)}` : "";
    redirect(`/csi/write${query}`);
  }

  const csiRoleInfo = await getUserPublicationRole("csi", user.id);

  return <WriteClient memberRole={csiRoleInfo.role} />;
}
