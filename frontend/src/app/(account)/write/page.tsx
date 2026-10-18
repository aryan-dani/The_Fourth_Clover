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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin, is_suspended")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role || "unverified";
  const isTechAuthor =
    !profile?.is_suspended &&
    (role === "tech_member" ||
      role === "tech_head" ||
      role === "super_admin" ||
      Boolean(profile?.is_admin));

  if (role === "unverified" && !profile?.is_admin) {
    redirect("/verify-csi");
  }

  if (!isTechAuthor) {
    redirect("/tech-weekly/write");
  }

  const params = await searchParams;
  if (params.publication === "csi") {
    const query = params.edit ? `?edit=${encodeURIComponent(params.edit)}` : "";
    redirect(`/csi/write${query}`);
  }

  const csiRoleInfo = await getUserPublicationRole("csi", user.id);

  return <WriteClient memberRole={csiRoleInfo.role} />;
}
