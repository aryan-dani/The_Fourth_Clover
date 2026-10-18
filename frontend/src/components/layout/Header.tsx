"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import {
  Menu,
  PenTool,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Bell,
  Check,
  Heart,
  MessageCircle,
  Reply,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Shield,
  Award,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { CloverMark } from "@/components/layout/CloverMark";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotificationHref,
  NotificationWithSender,
} from "@/features/notifications/notifications";
import { formatRelativeTime, cn } from "@/lib/utils";

function notificationIconForType(type: string) {
  switch (type) {
    case "like":
      return Heart;
    case "comment":
      return MessageCircle;
    case "reply":
      return Reply;
    case "follow":
      return User;
    case "review_submitted":
      return FileCheck;
    case "review_approved":
      return CheckCircle2;
    case "changes_requested":
      return AlertCircle;
    default:
      return Bell;
  }
}

export function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithSender[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const pathname = usePathname();

  const userId = user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setNotifLoading(true);
    try {
      const [notifResult, count] = await Promise.all([
        getNotifications(userId, 20),
        getUnreadCount(userId),
      ]);
      if (notifResult.data) {
        setNotifications(notifResult.data);
      }
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotifLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const t = window.setTimeout(() => {
      void fetchNotifications();
    }, 800);
    return () => window.clearTimeout(t);
  }, [userId, fetchNotifications]);

  useEffect(() => {
    if (!userId || !notifPopoverOpen) return;
    void fetchNotifications();
  }, [userId, notifPopoverOpen, fetchNotifications]);

  const isVerifiedTech =
    profile?.role === "tech_member" ||
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    Boolean(profile?.is_admin);

  const isTechHeadOrAdmin =
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    profile?.csi_id === 241 ||
    profile?.csi_id === 246 ||
    profile?.csi_id === 303 ||
    Boolean(profile?.is_admin);

  const isSuperAdmin =
    profile?.role === "super_admin" ||
    profile?.csi_id === 303 ||
    Boolean(profile?.is_admin);

  const isVerifiedRoster =
    Boolean(profile?.csi_id && profile?.role && profile.role !== "unverified") ||
    Boolean(profile?.is_admin);

  const writeHref = !user
    ? "/auth/signin"
    : isVerifiedTech
      ? "/tech-weekly/write"
      : "/verify-csi";

  const navItems = [
    {
      label: "Tech Weekly",
      href: "/tech-weekly",
      active:
        pathname === "/tech-weekly" ||
        (pathname.startsWith("/tech-weekly/") &&
          pathname !== "/tech-weekly/write" &&
          pathname !== "/tech-weekly/review") ||
        pathname === "/csi" ||
        pathname.startsWith("/csi/"),
    },
    {
      label: "Journal",
      href: "/explore",
      active: pathname === "/explore" || pathname.startsWith("/post/"),
    },
    ...(user
      ? [
          {
            label: "Following",
            href: "/explore/following",
            active: pathname === "/explore/following",
          },
        ]
      : []),
    ...(isTechHeadOrAdmin
      ? [
          {
            label: "Curation",
            href: "/tech-weekly/review",
            active:
              pathname === "/tech-weekly/review" || pathname === "/csi/review",
          },
        ]
      : []),
    ...(isSuperAdmin
      ? [
          {
            label: "Admin",
            href: "/admin",
            active: pathname === "/admin",
          },
        ]
      : []),
  ];

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    await markAllAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <LazyMotion features={domAnimation}>
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Colophon */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="group flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-85"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-2xs transition-colors group-hover:border-foreground/40">
                <CloverMark className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                The Fourth Clover
              </span>
            </Link>
            <span
              className="hidden h-4 w-px bg-border sm:inline-block"
              aria-hidden="true"
            />
            <Link
              href="/tech-weekly"
              className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              CSI MIT-WPU
            </Link>
          </div>

          {/* Center: Labeled Editorial Nav */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-1"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3.5 py-1.5 text-sm font-medium transition-colors",
                  item.active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
                {item.active && (
                  <m.span
                    layoutId="header-active-underline"
                    className="absolute inset-x-2 -bottom-[17px] h-[2px] bg-foreground"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {(isVerifiedTech || !user) && (
              <Button
                asChild
                size="sm"
                variant={
                  pathname === "/tech-weekly/write" || pathname === "/write"
                    ? "secondary"
                    : "default"
                }
                className="hidden sm:inline-flex h-8 rounded-md px-3.5 text-xs font-medium"
              >
                <Link href={writeHref}>
                  <PenTool className="mr-1.5 h-3.5 w-3.5" />
                  Write
                </Link>
              </Button>
            )}

            {user && !isVerifiedRoster && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="hidden sm:inline-flex h-8 rounded-md px-3 text-xs font-mono uppercase tracking-wider"
              >
                <Link href="/verify-csi">Verify CSI ID</Link>
              </Button>
            )}

            <ThemeToggle />

            {user && (
              <Popover
                open={notifPopoverOpen}
                onOpenChange={setNotifPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 rounded-md"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-foreground" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-80 p-0 rounded-lg border border-border bg-card shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-foreground">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void handleMarkAllAsRead()}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Check className="h-3 w-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <ScrollArea className="h-72">
                    {notifLoading && notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        No notifications yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((n) => {
                          const Icon = notificationIconForType(n.type);
                          const href = getNotificationHref(n);
                          return (
                            <Link
                              key={n.id}
                              href={href}
                              onClick={() => {
                                if (!n.read) void handleMarkAsRead(n.id);
                                setNotifPopoverOpen(false);
                              }}
                              className={cn(
                                "flex items-start gap-3 px-4 py-3 text-xs transition-colors hover:bg-muted/50",
                                !n.read && "bg-muted/30"
                              )}
                            >
                              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <div className="flex-1 space-y-1">
                                <p className="text-foreground leading-snug">
                                  {n.message}
                                </p>
                                <p className="font-mono text-[10px] text-muted-foreground">
                                  {formatRelativeTime(n.created_at)}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}

            {!loading &&
              (user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-md border border-border bg-card p-1 pr-2.5 text-xs font-medium transition-colors hover:border-foreground/30"
                    >
                      <Avatar className="h-6 w-6 rounded-sm">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="rounded-sm text-[10px] font-mono">
                          {profile?.full_name?.[0] ||
                            profile?.username?.[0] ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline-block max-w-[110px] truncate">
                        {profile?.full_name?.split(" ")[0] ||
                          profile?.username ||
                          "Account"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-60 rounded-lg border border-border bg-card p-1.5 shadow-lg"
                  >
                    <div className="px-2.5 py-2 border-b border-border mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {profile?.full_name || profile?.username}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground truncate">
                        @{profile?.username}
                        {profile?.csi_id ? ` · CSI #${profile.csi_id}` : ""}
                      </p>
                    </div>

                    {!isVerifiedRoster && (
                      <DropdownMenuItem asChild>
                        <Link href="/verify-csi" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Verify CSI Identity
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {isVerifiedTech && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/tech-weekly/write"
                          className="cursor-pointer"
                        >
                          <PenTool className="mr-2 h-4 w-4" />
                          Write for Tech Weekly
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {isTechHeadOrAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/tech-weekly/review"
                          className="cursor-pointer"
                        >
                          <Award className="mr-2 h-4 w-4" />
                          Wednesday Curation Queue
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {isSuperAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Super Admin Command
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => void signOut()}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-md px-3 text-xs font-medium"
                >
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
              ))}

            {/* Mobile Drawer */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8 rounded-md"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 border-l border-border bg-background p-6"
              >
                <SheetTitle className="font-display text-lg font-semibold">
                  The Fourth Clover
                </SheetTitle>
                <SheetDescription className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  CSI MIT-WPU Technical Publication
                </SheetDescription>

                <div className="mt-6 flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        item.active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href={writeHref}
                    onClick={() => setIsOpen(false)}
                    className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                  >
                    <PenTool className="mr-1.5 h-3.5 w-3.5" />
                    Write Dispatch
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </LazyMotion>
  );
}
