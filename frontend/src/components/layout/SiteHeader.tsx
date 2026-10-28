import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCapabilities } from "@/lib/roles";
import { SiteHeaderClient } from "@/components/layout/header/SiteHeaderClient";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    role: "unverified" | "member" | "tech_member" | "tech_head" | "super_admin";
    is_admin: boolean;
    is_suspended: boolean;
    csi_id: number | null;
  } | null = null;

  if (user?.id) {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, username, full_name, avatar_url, role, is_admin, is_suspended, csi_id",
      )
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  const caps = getCapabilities(profile);
  const signedIn = Boolean(user);

  return (
    <SiteHeaderClient
      signedIn={signedIn}
      profile={profile}
      capabilities={caps}
    />
  );
}
