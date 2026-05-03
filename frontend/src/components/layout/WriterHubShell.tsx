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
  PenTool,
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
      "w-full justify-start rounded-2xl gap-2 font-medium",
      active === section
        ? "bg-primary/15 text-primary ring-1 ring-primary/25 shadow-sm"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
    );

  const writeActive =
    pathname === "/write" || pathname.startsWith("/write?");
  const secondaryNav = (highlight: boolean) =>
    cn(
      "w-full justify-start rounded-2xl gap-2 font-medium",
      highlight
        ? "bg-muted/70 text-foreground ring-1 ring-border/80"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
    );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-72 lg:sticky lg:top-24 xl:w-80">
          <div className="rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl p-6 shadow-lg space-y-6 glass">
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar className="h-24 w-24 ring-4 ring-primary/15 shadow-md">
                <AvatarImage
                  src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                />
                <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary/25 to-primary/10">
                  {displayName[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-display text-lg font-semibold text-foreground leading-tight">
                  {displayName}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{handle}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {bioPreview}
              </p>
            </div>

            <nav className="flex flex-col gap-1.5">
              <Button variant="ghost" className={cn(navClass("posts"), "h-10")} asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  My posts
                </Link>
              </Button>
              <Button variant="ghost" className={cn(navClass("profile"), "h-10")} asChild>
                <Link href="/profile">
                  <UserRound className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  Profile &amp; links
                </Link>
              </Button>
              <Button variant="ghost" className={cn(secondaryNav(writeActive), "h-10")} asChild>
                <Link href="/write">
                  <PenTool className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  Write
                </Link>
              </Button>
              <Button variant="ghost" className={cn(secondaryNav(false), "h-10")} asChild>
                <Link href={publicHref}>
                  <ExternalLink className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  Public profile
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
