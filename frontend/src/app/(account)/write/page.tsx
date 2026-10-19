import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCapabilities } from "@/lib/roles";
import { WriteClient } from "./write-client";

export const dynamic = "force-dynamic";

export default async function WritePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin, is_suspended, csi_id")
    .eq("id", user.id)
    .maybeSingle();

  const caps = getCapabilities(profile);

  if (caps.isSuspended) {
    redirect("/");
  }

  // Journal writing is open to any signed-in non-suspended user.
  // CSI verification is optional (required only for Tech Weekly).
  // Optional ?edit= loading is handled client-side by WriteClient.
  if (!caps.canWriteJournal) {
    redirect("/auth/signin");
  }

  return <WriteClient />;
}
