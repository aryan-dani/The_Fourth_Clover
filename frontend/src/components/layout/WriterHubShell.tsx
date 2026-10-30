"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import {
  LayoutDashboard,
  UserRound,
  ExternalLink,
} from "lucide-react";
import { NAV_ICON_CLASS, NAV_STROKE } from "@/components/layout/nav-metrics";

type HubSection = "posts" | "profile";

export function WriterHubShell({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();
  const pathname = usePathname();

  const active: HubSection =
    pathname === "/profile" ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/")
      ? "profile"
      : "posts";

  const publicHref = profile?.username
    ? `/profile/${encodeURIComponent(profile.username)}`
    : "/settings";

  const displayName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name ||
    "Writer";
  const handle = profile?.username
    ? `@${profile.username}`
    : user?.email
      ? user.email.split("@")[0]
      : "";

  const bioPreview =
    profile?.bio?.trim().slice(0, 120) ||
    "Your public writer profile and posts.";

  const navClass = (section: HubSection) =>
    cn(
      "flex h-10 w-full items-center gap-2 border border-transparent px-3 text-sm font-medium transition-colors",
      active === section
        ? "border-[var(--fg-line)] bg-transparent text-foreground"
        : "text-muted-foreground hover:border-[var(--fg-line)] hover:text-foreground",
    );

  return (
    <div className="wrap pb-12 pt-6" data-lenis-prevent>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-64 xl:w-72">
          <div className="space-y-5 border border-[var(--fg-line)] p-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-16 w-16 ring-1 ring-[var(--fg-line)]">
                <AvatarImage
                  src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                />
                <AvatarFallback className="bg-surface text-xl font-medium">
                  {displayName[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="type-person text-lg text-foreground">
                  {displayName}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{handle}</p>
              </div>
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {bioPreview}
              </p>
            </div>

            <nav className="flex flex-col gap-1" aria-label="Studio">
              <Link href="/dashboard" className={navClass("posts")}>
                <LayoutDashboard
                  className={NAV_ICON_CLASS}
                  strokeWidth={NAV_STROKE}
                />
                My Posts
              </Link>
              <Link href="/settings" className={navClass("profile")}>
                <UserRound
                  className={NAV_ICON_CLASS}
                  strokeWidth={NAV_STROKE}
                />
                Profile &amp; Links
              </Link>
              <Link
                href={publicHref}
                className="flex h-10 w-full items-center gap-2 border border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-[var(--fg-line)] hover:text-foreground"
              >
                <ExternalLink
                  className={NAV_ICON_CLASS}
                  strokeWidth={NAV_STROKE}
                />
                Public Profile
              </Link>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-8">{children}</div>
      </div>
    </div>
  );
}
