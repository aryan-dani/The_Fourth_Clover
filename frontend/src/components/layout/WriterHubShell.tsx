"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
    pathname === "/profile" ? "profile" : "posts";

  const publicHref = profile?.username
    ? `/profile/${encodeURIComponent(profile.username)}`
    : "/profile";

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
      "w-full justify-start rounded-sm gap-2 font-medium",
      active === section
        ? "bg-surface text-foreground ring-1 ring-[var(--fg-line)]"
        : "text-muted-foreground hover:text-foreground hover:bg-surface/70",
    );

  return (
    <div className="wrap pt-6 pb-12" data-lenis-prevent>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-72 xl:w-80">
          <div className="space-y-6 border border-[var(--fg-line)] bg-[var(--bg)] p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-20 w-20 ring-1 ring-[var(--fg-line)]">
                <AvatarImage
                  src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                />
                <AvatarFallback className="bg-surface text-2xl font-medium">
                  {displayName[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="type-display text-lg leading-tight">
                  {displayName}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{handle}</p>
              </div>
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {bioPreview}
              </p>
            </div>

            <nav className="flex flex-col gap-1.5">
              <Button variant="ghost" className={cn(navClass("posts"), "h-10")} asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  My Posts
                </Link>
              </Button>
              <Button variant="ghost" className={cn(navClass("profile"), "h-10")} asChild>
                <Link href="/profile">
                  <UserRound className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  Profile &amp; Links
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="h-10 w-full justify-start gap-2 rounded-sm font-medium text-muted-foreground hover:bg-surface/70 hover:text-foreground"
                asChild
              >
                <Link href={publicHref}>
                  <ExternalLink className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  Public Profile
                </Link>
              </Button>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">{children}</div>
      </div>
    </div>
  );
}
