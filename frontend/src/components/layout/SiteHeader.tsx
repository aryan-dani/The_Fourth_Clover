import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCapabilities } from "@/lib/roles";
import { CloverMark } from "@/components/layout/CloverMark";
import { HeaderNav } from "@/components/layout/header/HeaderNav";
import { HeaderActions } from "@/components/layout/header/HeaderActions";
import { MobileNav } from "@/components/layout/header/MobileNav";
import { MobileDock } from "@/components/layout/header/MobileDock";

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
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="pointer-events-auto mx-auto max-w-content px-3 pt-3 sm:px-6 sm:pt-4">
          <div
            className="nav-dock flex h-[3.25rem] items-center gap-1 px-2 sm:h-14 sm:gap-2 sm:px-2.5"
            role="navigation"
            aria-label="Site"
          >
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-opacity duration-editorial hover:opacity-90 sm:pr-3"
            >
              <span className="circle-logo h-8 w-8 text-sm shadow-none ring-1 ring-brand/20">
                <CloverMark size="sm" />
              </span>
              <span className="hidden font-display text-[15px] font-semibold tracking-tight text-foreground sm:inline">
                Fourth Clover
              </span>
            </Link>

            <HeaderNav
              signedIn={signedIn}
              className="hidden min-w-0 flex-1 justify-center md:flex"
            />

            <div className="ml-auto flex items-center gap-0.5 border-l border-hairline pl-1.5 sm:gap-1 sm:pl-2">
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
        </div>
      </header>

      <MobileDock signedIn={signedIn} capabilities={caps} />
    </>
  );
}
