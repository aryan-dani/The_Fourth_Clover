import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCapabilities } from "@/lib/roles";
import { CloverMark } from "@/components/layout/CloverMark";
import { HeaderNav } from "@/components/layout/header/HeaderNav";
import { HeaderActions } from "@/components/layout/header/HeaderActions";
import { MobileNav } from "@/components/layout/header/MobileNav";

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity duration-editorial hover:opacity-80"
          >
            <span className="circle-logo h-8 w-8 text-sm">
              <CloverMark size="sm" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight text-foreground">
              The Fourth Clover
            </span>
          </Link>

          <HeaderNav signedIn={signedIn} className="hidden md:flex" />
        </div>

        <div className="flex items-center gap-1.5">
          <HeaderActions
            signedIn={signedIn}
            profile={profile}
            capabilities={caps}
          />
          <MobileNav
            signedIn={signedIn}
            profile={profile}
            capabilities={caps}
          />
        </div>
      </div>
    </header>
  );
}
