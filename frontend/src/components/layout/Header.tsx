"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/features/auth/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  PenSquare,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  LayoutDashboard,
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Check,
  Shield,
  Award,
  CheckCircle2,
  Home,
  Terminal,
  Compass,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/utils";
import { logSupabaseError } from "@/lib/dev/debug-supabase";
import { syncUserVerificationStatusAction } from "@/features/data/csi-verification-actions";
import type { Notification, Profile, Post } from "@/types/database";

type NotificationWithDetails = Notification & {
  actor: Pick<Profile, "id" | "username" | "full_name" | "avatar_url">;
  post: Pick<Post, "id" | "title" | "slug"> | null;
  comment: null;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
};

export function Header() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const role = profile?.role || (profile?.is_admin ? "super_admin" : "unverified");
  const csiId = profile?.csi_id ?? null;
  const isSuperAdmin =
    role === "super_admin" || csiId === 303 || Boolean(profile?.is_admin);
  const isTechHead = role === "tech_head" || csiId === 241 || csiId === 246;
  const isTechWriter = role === "tech_member" || isTechHead || isSuperAdmin;
  const isVerifiedRoster = Boolean(csiId && role !== "unverified") || isSuperAdmin;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoadingNotifications(true);
    try {
      const { data: notifData, error: notifError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);

      if (notifError) {
        logSupabaseError("Error fetching notifications", notifError);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (!notifData || notifData.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const actorIds = Array.from(
        new Set(notifData.map((n) => n.actor_id).filter(Boolean))
      );
      const postIds = Array.from(
        new Set(
          notifData
            .map((n) => n.post_id)
            .filter((id): id is string => id !== null)
        )
      );

      const [actorsRes, postsRes] = await Promise.all([
        actorIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .in("id", actorIds)
          : Promise.resolve({ data: [] }),
        postIds.length > 0
          ? supabase.from("posts").select("id, title, slug").in("id", postIds)
          : Promise.resolve({ data: [] }),
      ]);

      const actorsMap = new Map((actorsRes.data || []).map((a) => [a.id, a]));
      const postsMap = new Map((postsRes.data || []).map((p) => [p.id, p]));

      const enriched: NotificationWithDetails[] = notifData
        .map((n) => {
          const actor = actorsMap.get(n.actor_id);
          if (!actor) return null;
          return {
            ...n,
            actor,
            post: n.post_id ? postsMap.get(n.post_id) || null : null,
            comment: null,
          };
        })
        .filter((n): n is NotificationWithDetails => n !== null);

      setNotifications(enriched);
      setUnreadCount(enriched.filter((n) => !n.read).length);
    } catch (error) {
      logSupabaseError("Error fetching notifications", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only sync verification status once per browser session to avoid slowing down route changes
  useEffect(() => {
    if (!user?.id || !profile) return;
    const cacheKey = `csi_verified_sync_${user.id}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(cacheKey)) {
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(cacheKey, "1");
    }
    syncUserVerificationStatusAction().then((res) => {
      if (
        res.authenticated &&
        (res.role !== profile.role || res.csiId !== profile.csi_id)
      ) {
        void refreshProfile();
      }
    });
  }, [user?.id, profile, refreshProfile]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
  }, [user?.id, fetchNotifications]);

  useEffect(() => {
    if (notificationsOpen && user?.id) {
      fetchNotifications();
    }
  }, [notificationsOpen, user?.id, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      logSupabaseError("Error marking notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      logSupabaseError("Error marking all as read", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-3.5 w-3.5 text-rose-500" />;
      case "comment":
      case "reply":
        return <MessageCircle className="h-3.5 w-3.5 text-primary" />;
      case "follow":
        return <UserPlus className="h-3.5 w-3.5 text-emerald-600" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getNotificationMessage = (notification: NotificationWithDetails) => {
    const actorName =
      notification.actor.full_name || notification.actor.username;
    switch (notification.type) {
      case "like":
        return (
          <>
            <span className="font-medium text-foreground">{actorName}</span>{" "}
            endorsed{" "}
            <span className="font-medium text-foreground">
              {notification.post?.title || "your post"}
            </span>
          </>
        );
      case "comment":
        return (
          <>
            <span className="font-medium text-foreground">{actorName}</span>{" "}
            commented on{" "}
            <span className="font-medium text-foreground">
              {notification.post?.title || "your post"}
            </span>
          </>
        );
      case "reply":
        return (
          <>
            <span className="font-medium text-foreground">{actorName}</span>{" "}
            replied to your comment
          </>
        );
      case "follow":
        return (
          <>
            <span className="font-medium text-foreground">{actorName}</span>{" "}
            followed you
          </>
        );
      default:
        return <span>New notification</span>;
    }
  };

  const getNotificationLink = (notification: NotificationWithDetails) => {
    switch (notification.type) {
      case "like":
      case "comment":
      case "reply":
        return notification.post?.slug ? `/post/${notification.post.slug}` : "#";
      case "follow":
        return `/profile/${notification.actor.username}`;
      default:
        return "#";
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/tech-weekly",
      label: "Tech Weekly",
      icon: Terminal,
      active:
        Boolean(pathname?.startsWith("/tech-weekly")) &&
        !pathname?.startsWith("/tech-weekly/review") &&
        !pathname?.startsWith("/tech-weekly/write"),
    },
    {
      href: "/explore",
      label: "Journal",
      icon: Compass,
      active: pathname === "/explore",
    },
    ...(user
      ? [
          {
            href: "/explore/following",
            label: "Following",
            icon: Users,
            active: pathname === "/explore/following",
          },
        ]
      : []),
    ...(isTechHead || isSuperAdmin
      ? [
          {
            href: "/tech-weekly/review",
            label: "Review",
            icon: Award,
            active: Boolean(pathname?.startsWith("/tech-weekly/review")),
          },
        ]
      : []),
    ...(isSuperAdmin
      ? [
          {
            href: "/admin",
            label: "Admin",
            icon: Shield,
            active: Boolean(pathname?.startsWith("/admin")),
          },
        ]
      : []),
  ];

  const roleBadgeLabel = () => {
    if (isSuperAdmin) return `CSI #${csiId ?? 303} · Admin`;
    if (isTechHead) return `CSI #${csiId} · Tech Head`;
    if (role === "tech_member" && csiId) return `CSI #${csiId} · Tech`;
    if (role === "member" && csiId) return `CSI #${csiId} · Member`;
    return null;
  };

  return (
    <LazyMotion features={domAnimation}>
      {/* Top Floating Dock Container */}
      <header className="sticky top-0 z-50 w-full px-3 pt-3 pb-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl border border-border/80 bg-card/85 px-3 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl dark:bg-card/80 dark:shadow-[0_8px_30px_rgb(0,0,0,0.28)]">
          {/* Left: Signature Fourth Clover Leaf + Brand */}
          <Link
            href="/"
            prefetch={true}
            className="group flex items-center gap-2.5 pr-1 focus:outline-none"
          >
            <div className="circle-logo h-9 w-9 transition-transform duration-200 group-hover:scale-105">
              <span className="text-lg leading-none" role="img" aria-label="Clover">
                🍀
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
                The Fourth Clover
              </span>
              <span className="hidden xl:inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                CSI MIT-WPU
              </span>
            </div>
          </Link>

          {/* Center: Interactive macOS/Linear-Style Floating Dock Track (Desktop) */}
          <nav
            aria-label="Primary Dock"
            className="hidden md:flex items-center gap-1 rounded-xl border border-border/70 bg-muted/55 p-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className="relative"
                >
                  <m.div
                    whileHover={{ y: -1.5, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    className={`relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      item.active
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.active && (
                      <m.span
                        layoutId="header-dock-active-pill"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                        className="absolute inset-0 -z-10 rounded-lg bg-primary shadow-sm"
                      />
                    )}
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </m.div>
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions & User Control Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {mounted && !loading && user && (
              <>
                {isTechWriter ? (
                  <Button
                    asChild
                    size="sm"
                    className="h-8 rounded-xl px-3.5 text-xs font-semibold shadow-sm"
                  >
                    <Link href="/tech-weekly/write" prefetch={true}>
                      <PenSquare className="mr-1.5 h-3.5 w-3.5" />
                      Write
                    </Link>
                  </Button>
                ) : !isVerifiedRoster ? (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-xl border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                  >
                    <Link href="/verify-csi" prefetch={true}>
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Verify CSI ID
                    </Link>
                  </Button>
                ) : null}
              </>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {!mounted || loading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <>
                {/* Notifications Popover */}
                <Popover
                  open={notificationsOpen}
                  onOpenChange={setNotificationsOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                      aria-label="Notifications"
                    >
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 sm:w-96 p-0 rounded-2xl border-border shadow-xl"
                    align="end"
                  >
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Activity
                      </span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Check className="h-3 w-3" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[340px] overflow-y-auto divide-y divide-border">
                      {loadingNotifications ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">
                          Loading activity...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-xs text-muted-foreground">
                            No notifications yet.
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            href={getNotificationLink(notification)}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                              setNotificationsOpen(false);
                            }}
                            className={`flex items-start gap-3 px-4 py-3 text-xs transition-colors hover:bg-muted/60 ${
                              !notification.read ? "bg-primary/5" : ""
                            }`}
                          >
                            <Avatar className="h-7 w-7 border border-border">
                              <AvatarImage
                                src={notification.actor.avatar_url || ""}
                              />
                              <AvatarFallback className="text-[10px]">
                                {notification.actor.full_name?.[0] ||
                                  notification.actor.username?.[0] ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="leading-snug text-muted-foreground">
                                {getNotificationMessage(notification)}
                              </p>
                              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                {getNotificationIcon(notification.type)}
                                <span>
                                  {formatRelativeTime(notification.created_at)}
                                </span>
                              </p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>

                    <div className="border-t border-border p-2 text-center">
                      <Link
                        href="/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="block py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 pl-1 pr-2.5 py-1 text-xs font-semibold hover:bg-muted/60 transition-colors focus:outline-none"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={profile?.avatar_url || ""}
                          alt={profile?.full_name || "User"}
                        />
                        <AvatarFallback className="text-[10px] font-semibold">
                          {profile?.full_name?.[0] ||
                            profile?.username?.[0] ||
                            user.email?.[0]?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline max-w-[96px] truncate text-foreground">
                        {profile?.full_name?.split(" ")[0] ||
                          profile?.username ||
                          "Account"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-64 rounded-2xl border-border p-1.5 shadow-xl"
                    align="end"
                  >
                    <DropdownMenuLabel className="font-normal px-2.5 py-2">
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-foreground leading-none">
                          {profile?.full_name || profile?.username || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                        {roleBadgeLabel() ? (
                          <div className="pt-1">
                            <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                              {roleBadgeLabel()}
                            </span>
                          </div>
                        ) : (
                          <div className="pt-1">
                            <Link
                              href="/verify-csi"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                            >
                              Verify CSI ID & PRN
                            </Link>
                          </div>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link href="/tech-weekly" className="cursor-pointer">
                        <Terminal className="mr-2 h-4 w-4" />
                        <span>CSI Tech Weekly</span>
                      </Link>
                    </DropdownMenuItem>

                    {isTechWriter && (
                      <DropdownMenuItem asChild className="rounded-lg">
                        <Link
                          href="/tech-weekly/write"
                          className="cursor-pointer"
                        >
                          <PenSquare className="mr-2 h-4 w-4" />
                          <span>Write Dispatch</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {(isTechHead || isSuperAdmin) && (
                      <DropdownMenuItem asChild className="rounded-lg">
                        <Link
                          href="/tech-weekly/review"
                          className="cursor-pointer"
                        >
                          <Award className="mr-2 h-4 w-4" />
                          <span>Wednesday Review Queue</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {isSuperAdmin && (
                      <DropdownMenuItem asChild className="rounded-lg">
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Super Admin Console</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Author Dashboard</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                asChild
                size="sm"
                className="h-8 rounded-xl px-4 text-xs font-semibold"
              >
                <Link href="/auth/signin" prefetch={true}>
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Floating Bottom Glass Dock */}
      <AnimatePresence>
        <div className="fixed bottom-4 inset-x-3 z-50 flex justify-center md:hidden pointer-events-none">
          <nav
            aria-label="Mobile Dock"
            className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border/80 bg-card/90 p-1.5 shadow-[0_12px_36px_rgb(0,0,0,0.18)] backdrop-blur-2xl"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className="relative"
                >
                  <m.div
                    whileTap={{ scale: 0.92 }}
                    className={`relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                      item.active
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.active && (
                      <m.span
                        layoutId="mobile-dock-active-pill"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                        className="absolute inset-0 -z-10 rounded-xl bg-primary shadow-sm"
                      />
                    )}
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </m.div>
                </Link>
              );
            })}
          </nav>
        </div>
      </AnimatePresence>
    </LazyMotion>
  );
}
