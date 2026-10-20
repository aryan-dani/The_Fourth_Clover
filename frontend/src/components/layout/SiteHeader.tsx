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
            className="flex h-14 items-center gap-2 rounded-2xl border border-hairline bg-card px-2 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.06)] sm:gap-3 sm:px-3 dark:shadow-[0_1px_2px_rgb(0_0_0/0.2),0_8px_28px_rgb(0_0_0/0.35)]"
            role="navigation"
            aria-label="Site"
          >
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 rounded-xl px-1.5 py-1 transition-opacity duration-editorial hover:opacity-80 sm:px-2"
            >
              <span className="circle-logo h-8 w-8 text-sm">
                <CloverMark size="sm" />
              </span>
              <span className="hidden font-display text-[15px] font-semibold tracking-tight text-foreground sm:inline">
                The Fourth Clover
              </span>
            </Link>

            <div className="mx-1 hidden h-7 w-px shrink-0 bg-hairline md:block" />

            <HeaderNav
              signedIn={signedIn}
              className="hidden min-w-0 flex-1 justify-center md:flex"
            />

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
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
