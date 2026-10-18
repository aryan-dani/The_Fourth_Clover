"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Menu,
  BookOpen,
  Terminal,
  PenTool,
  Users,
  User,
  LogOut,
  Settings,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Bell,
  Check,
  Heart,
  MessageCircle,
  Reply,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotificationHref,
  NotificationWithSender,
} from "@/features/notifications/notifications";
import { formatRelativeTime, cn } from "@/lib/utils";
import { motionEase, springSnappy } from "@/lib/motion";
import {
  NAV_PILL_SHELL,
  NAV_ICON_BOX,
  NAV_ICON_CLASS,
  NAV_PILL_DIVIDER,
  NAV_STROKE,
} from "@/components/layout/nav-metrics";

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
  const [isClient, setIsClient] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithSender[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [navPendingHref, setNavPendingHref] = useState<string | null>(null);
  const pathname = usePathname();

  const userId = user?.id;

  const handleMainNavClick = useCallback(
    (href: string) => {
      if (pathname !== href) setNavPendingHref(href);
    },
    [pathname],
  );

  useEffect(() => {
    if (navPendingHref && pathname === navPendingHref) {
      setNavPendingHref(null);
    }
  }, [pathname, navPendingHref]);

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
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const t = window.setTimeout(() => {
      void fetchNotifications();
    }, 1200);
    return () => window.clearTimeout(t);
  }, [userId, fetchNotifications]);

  useEffect(() => {
    if (!userId || !notifPopoverOpen) return;
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId, notifPopoverOpen, fetchNotifications]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isVerifiedTech =
    profile?.role === "tech_member" ||
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
    Boolean(profile?.is_admin);

  const isTechHeadOrAdmin =
    profile?.role === "tech_head" ||
    profile?.role === "super_admin" ||
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

  const primaryNav: {
    name: string;
    href: string;
    icon: typeof BookOpen;
  }[] = [
    { name: "Tech Weekly", href: "/tech-weekly", icon: Terminal },
    { name: "Explore", href: "/explore", icon: BookOpen },
    ...(user
      ? [{ name: "Following", href: "/explore/following", icon: Users }]
      : []),
    ...(isVerifiedTech || !user
      ? [{ name: "Write", href: writeHref, icon: PenTool }]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/tech-weekly" || href === "/csi") {
      return (
        pathname === "/tech-weekly" ||
        (pathname.startsWith("/tech-weekly/") &&
          pathname !== "/tech-weekly/write") ||
        pathname === "/csi" ||
        (pathname.startsWith("/csi/") && pathname !== "/csi/write")
      );
    }
    if (
      href === "/write" ||
      href === "/tech-weekly/write" ||
      href === "/verify-csi"
    ) {
      return (
        pathname === "/write" ||
        pathname === "/csi/write" ||
        pathname === "/tech-weekly/write"
      );
    }
    return pathname === href;
  };
  const isExploreActive = pathname === "/explore";
  const isCsiActive = isActive("/tech-weekly");
  const isFollowingActive = pathname === "/explore/following";
  const isWriteActive = isActive("/tech-weekly/write");

  const pillSpring = {
    type: "spring" as const,
    stiffness: 700,
    damping: 30,
  };

  const quickSpring = springSnappy;

  return (
    <LazyMotion features={domAnimation}>
      {/* Left - Logo */}
      <m.header
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: motionEase }}
        className="fixed top-4 left-4 z-50"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/" className="group" aria-label="Home">
              <m.div
                whileHover={{ scale: 1.08, rotate: -4 }}
                whileTap={{ scale: 0.94 }}
                transition={quickSpring}
                className="border-border/60 bg-card ring-border flex h-[52px] w-[52px] items-center justify-center rounded-full border shadow-lg ring-1"
              >
                <span className="text-lg leading-none" aria-hidden>
                  🍀
                </span>
              </m.div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={10}>
            <p className="text-xs font-medium">Home</p>
          </TooltipContent>
        </Tooltip>
      </m.header>

      {/* Center - Navigation Pill */}
      <m.header
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: motionEase }}
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center"
      >
        <m.nav
          layout
          transition={quickSpring}
          className={cn(
            NAV_PILL_SHELL,
            "pointer-events-auto gap-1 px-1 shadow-lg transition-shadow duration-200",
            scrolled
              ? "border-border/70 bg-card/90 shadow-xl"
              : "border-border/50 bg-card/85",
          )}
        >
          {/* Explore */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/explore"
                onClick={() => handleMainNavClick("/explore")}
                aria-label="Explore"
                className={cn(
                  NAV_ICON_BOX,
                  "relative transition-all duration-150",
                  navPendingHref === "/explore" && pathname !== "/explore"
                    ? "opacity-55"
                    : "",
                  isExploreActive
                    ? "text-primary"
                    : "text-foreground/80 hover:text-foreground dark:text-foreground/85 dark:hover:text-foreground",
                )}
              >
                {isExploreActive && (
                  <m.div
                    layoutId="activeNavBg"
                    className="bg-primary/15 ring-primary/25 absolute inset-0 rounded-full ring-1 ring-inset"
                    transition={pillSpring}
                  />
                )}
                <m.div
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  transition={quickSpring}
                  className="relative z-10"
                >
                  <BookOpen
                    className={NAV_ICON_CLASS}
                    strokeWidth={NAV_STROKE}
                  />
                </m.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
              <p className="text-xs font-medium">Explore</p>
            </TooltipContent>
          </Tooltip>

          {/* CSI Tech Weekly */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/tech-weekly"
                onClick={() => handleMainNavClick("/tech-weekly")}
                aria-label="CSI Tech Weekly"
                className={cn(
                  NAV_ICON_BOX,
                  "relative transition-all duration-150",
                  navPendingHref === "/tech-weekly" && !isCsiActive ? "opacity-55" : "",
                  isCsiActive
                    ? "text-primary"
                    : "text-foreground/80 hover:text-foreground dark:text-foreground/85 dark:hover:text-foreground",
                )}
              >
                {isCsiActive && (
                  <m.div
                    layoutId="activeNavBg"
                    className="bg-primary/15 ring-primary/25 absolute inset-0 rounded-full ring-1 ring-inset"
                    transition={pillSpring}
                  />
                )}
                <m.div
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  transition={quickSpring}
                  className="relative z-10"
                >
                  <Terminal
                    className={NAV_ICON_CLASS}
                    strokeWidth={NAV_STROKE}
                  />
                </m.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
              <p className="text-xs font-medium">CSI Tech Weekly</p>
            </TooltipContent>
          </Tooltip>

          {/* Following (signed in) */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/explore/following"
                  onClick={() => handleMainNavClick("/explore/following")}
                  aria-label="Following"
                  className={cn(
                    NAV_ICON_BOX,
                    "relative transition-all duration-150",
                    navPendingHref === "/explore/following" &&
                      pathname !== "/explore/following"
                      ? "opacity-55"
                      : "",
                    isFollowingActive
                      ? "text-primary"
                      : "text-foreground/80 hover:text-foreground dark:text-foreground/85 dark:hover:text-foreground",
                  )}
                >
                  {isFollowingActive && (
                    <m.div
                      layoutId="activeNavBg"
                      className="bg-primary/15 ring-primary/25 absolute inset-0 rounded-full ring-1 ring-inset"
                      transition={pillSpring}
                    />
                  )}
                  <m.div
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    transition={quickSpring}
                    className="relative z-10"
                  >
                    <Users
                      className={NAV_ICON_CLASS}
                      strokeWidth={NAV_STROKE}
                    />
                  </m.div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={10}>
                <p className="text-xs font-medium">Following</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Write */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={writeHref}
                onClick={() => handleMainNavClick(writeHref)}
                aria-label="Write"
                className={cn(
                  NAV_ICON_BOX,
                  "relative transition-all duration-150",
                  navPendingHref === writeHref && !isWriteActive
                    ? "opacity-55"
                    : "",
                  isWriteActive
                    ? "text-primary"
                    : "text-foreground/80 hover:text-foreground dark:text-foreground/85 dark:hover:text-foreground",
                )}
              >
                {isWriteActive && (
                  <m.div
                    layoutId="activeNavBg"
                    className="bg-primary/15 ring-primary/25 absolute inset-0 rounded-full ring-1 ring-inset"
                    transition={pillSpring}
                  />
                )}
                <m.div
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  transition={quickSpring}
                  className="relative z-10"
                >
                  <PenTool
                    className={NAV_ICON_CLASS}
                    strokeWidth={NAV_STROKE}
                  />
                </m.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
              <p className="text-xs font-medium">
                {isVerifiedTech ? "Write for Tech Weekly" : user ? "Verify CSI ID to Write" : "Sign in to Write"}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="ml-1 md:hidden">
              <m.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={quickSpring}
                aria-label="Open navigation menu"
                className={cn(
                  NAV_ICON_BOX,
                  "text-foreground/80 hover:bg-muted/90 hover:text-foreground transition-colors duration-150 dark:text-foreground/85",
                )}
              >
                <Menu className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
              </m.button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-card/97 border-border/60 w-80 rounded-l-3xl border-l p-0 shadow-2xl backdrop-blur-xl"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <SheetDescription className="sr-only">
                Site sections, theme, notifications, and sign-in links.
              </SheetDescription>
              <div className="flex h-full flex-col">
                <div className="border-border/60 bg-muted/40 flex items-center gap-3 border-b p-5">
                  <div className="bg-muted ring-border flex h-[52px] w-[52px] items-center justify-center rounded-full ring-2">
                    <span className="text-2xl leading-none" aria-hidden>
                      🍀
                    </span>
                  </div>
                  <div>
                    <span className="font-display text-foreground font-semibold">
                      The Fourth Clover
                    </span>
                    <p className="text-muted-foreground font-sans text-xs">
                      Navigation
                    </p>
                  </div>
                </div>

                <nav className="flex flex-col gap-1 p-3">
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-sans transition-all ${
                      pathname === "/"
                        ? "bg-primary/12 text-primary ring-primary/20 ring-1"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span className="mr-1 text-2xl leading-none" aria-hidden>
                      🍀
                    </span>
                    <span className="font-medium">Home</span>
                  </Link>
                  {primaryNav.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-sans transition-all ${
                        isActive(item.href)
                          ? "bg-primary/12 text-primary ring-primary/15 ring-1"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      <item.icon className="h-5 w-5" strokeWidth={1.8} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                </nav>

                {user && (
                  <div className="border-border/50 space-y-2 border-b px-3 pb-3">
                    <p className="text-muted-foreground px-2 text-[11px] font-medium tracking-wide uppercase">
                      Appearance & Alerts
                    </p>
                    <div className="flex items-center gap-2 px-2">
                      <ThemeToggle />
                      <span className="text-muted-foreground text-sm">
                        Theme
                      </span>
                    </div>
                    <Link
                      href="/notifications"
                      onClick={() => setIsOpen(false)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-3 rounded-2xl px-4 py-3"
                    >
                      <Bell className="h-5 w-5" strokeWidth={1.8} />
                      <span className="font-medium">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </div>
                )}

                {!user && (
                  <div className="border-border/50 mt-auto space-y-2 border-t p-4">
                    <Button
                      asChild
                      variant="outline"
                      className="h-12 w-full rounded-2xl"
                    >
                      <Link
                        href="/auth/signin"
                        onClick={() => setIsOpen(false)}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild className="h-12 w-full rounded-2xl">
                      <Link
                        href="/auth/signup"
                        onClick={() => setIsOpen(false)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </m.nav>
      </m.header>

      {/* Right - theme | notifications | account (aligned segmented bar) */}
      <m.div
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: motionEase, delay: 0.05 }}
        className="fixed top-4 right-4 z-50 hidden h-[52px] items-center md:flex"
      >
        {!isClient || loading ? (
          <div
            className={cn(
              NAV_PILL_SHELL,
              "border-border/50 bg-muted w-44 animate-pulse px-1 shadow-none",
            )}
          />
        ) : user ? (
          <div
            className={cn(
              NAV_PILL_SHELL,
              "border-border/70 bg-card/95 dark:bg-card/90 gap-0 px-1 shadow-md dark:shadow-black/20",
            )}
            role="toolbar"
            aria-label="Account and settings"
          >
            <ThemeToggle />
            <span className={NAV_PILL_DIVIDER} aria-hidden />
            <Popover open={notifPopoverOpen} onOpenChange={setNotifPopoverOpen}>
              <PopoverTrigger asChild>
                <m.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={quickSpring}
                  className={cn(
                    NAV_ICON_BOX,
                    "text-foreground/85 hover:bg-muted/90 hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  )}
                  aria-label="Notifications"
                >
                  <Bell className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  {unreadCount > 0 && (
                    <span className="ring-card absolute -top-0.5 -right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </m.button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={10}
                className="border-border/80 w-[min(24rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-xl"
              >
                <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unreadCount > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-xs"
                      onClick={async () => {
                        if (!userId) return;
                        await markAllAsRead(userId);
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true })),
                        );
                        setUnreadCount(0);
                      }}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Mark All Read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[min(22rem,50vh)]">
                  {notifLoading && notifications.length === 0 ? (
                    <p className="text-muted-foreground p-4 text-sm">
                      Loading...
                    </p>
                  ) : notifications.length === 0 ? (
                    <p className="text-muted-foreground p-4 text-sm">
                      You&apos;re all caught up.
                    </p>
                  ) : (
                    <ul className="p-1">
                      {notifications.map((n) => {
                        const IconCmp = n.from_user
                          ? null
                          : notificationIconForType(n.type);
                        const href = getNotificationHref(n);
                        return (
                          <li key={n.id}>
                            <Link
                              href={href}
                              className={`hover:bg-muted/80 flex gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                !n.read ? "bg-primary/5" : ""
                              }`}
                              onClick={async () => {
                                if (!n.read) {
                                  await markAsRead(n.id);
                                  setNotifications((prev) =>
                                    prev.map((x) =>
                                      x.id === n.id ? { ...x, read: true } : x,
                                    ),
                                  );
                                  setUnreadCount((c) => Math.max(0, c - 1));
                                }
                                setNotifPopoverOpen(false);
                              }}
                            >
                              <div className="mt-0.5 shrink-0">
                                {n.from_user ? (
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage
                                      src={n.from_user.avatar_url || ""}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {n.from_user.full_name?.[0] || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : IconCmp ? (
                                  <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-full">
                                    <IconCmp className="text-primary h-4 w-4" />
                                  </div>
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-3 text-sm leading-snug">
                                  {n.message}
                                </p>
                                <p className="text-muted-foreground mt-1 text-[11px]">
                                  {formatRelativeTime(n.created_at)}
                                </p>
                              </div>
                              {!n.read && (
                                <span className="bg-primary mt-2 h-2 w-2 shrink-0 rounded-full" />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </ScrollArea>
                <div className="border-border border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-xl"
                    asChild
                  >
                    <Link
                      href="/notifications"
                      onClick={() => setNotifPopoverOpen(false)}
                    >
                      View All Notifications
                    </Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <span className={NAV_PILL_DIVIDER} aria-hidden />

            <DropdownMenu
              open={profileMenuOpen}
              onOpenChange={setProfileMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <m.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={quickSpring}
                  className={cn(
                    NAV_ICON_BOX,
                    "from-primary/20 via-primary/8 ring-border/50 focus-visible:ring-ring focus-visible:ring-offset-background bg-gradient-to-br to-transparent ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  )}
                  aria-label="Account menu"
                >
                  <Avatar className="ring-background h-8 w-8 ring-2">
                    <AvatarImage
                      src={
                        profile?.avatar_url || user.user_metadata?.avatar_url
                      }
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {profile?.full_name?.[0] ||
                        user.user_metadata?.full_name?.[0] ||
                        user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </m.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="border-border bg-popover w-72 overflow-hidden rounded-xl border p-0 shadow-lg"
              >
                <div className="border-border border-b px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          profile?.avatar_url || user.user_metadata?.avatar_url
                        }
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                        {profile?.full_name?.[0] ||
                          user.user_metadata?.full_name?.[0] ||
                          user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {profile?.full_name ||
                          user.user_metadata?.full_name ||
                          "Writer"}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        @{profile?.username || "user"}
                        {profile?.csi_id ? ` · CSI #${profile.csi_id}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-border border-b p-1.5">
                  {!isVerifiedRoster && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/verify-csi"
                        className="flex cursor-pointer items-center gap-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-2 mb-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          Verify your CSI ID
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link
                      href="/tech-weekly"
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
                    >
                      <Terminal className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm font-medium">
                        CSI Tech Weekly
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  {isTechHeadOrAdmin && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/tech-weekly/review"
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
                      >
                        <FileCheck className="text-emerald-500 h-4 w-4" />
                        <span className="text-sm font-medium">
                          Tech Weekly Review Queue
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isSuperAdmin && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
                      >
                        <CheckCircle2 className="text-amber-500 h-4 w-4" />
                        <span className="text-sm font-medium">
                          Super Admin Panel
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
                    >
                      <LayoutDashboard className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
                    >
                      <User className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm font-medium">Edit Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
                    >
                      <Settings className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </div>

                <div className="p-1.5">
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <m.div
            layout
            transition={quickSpring}
            className={cn(
              NAV_PILL_SHELL,
              "border-border/70 bg-card/95 dark:bg-card/90 gap-0 px-1 shadow-md dark:shadow-black/20",
            )}
            role="toolbar"
            aria-label="Sign in and appearance"
          >
            <ThemeToggle />
            <span className={NAV_PILL_DIVIDER} aria-hidden />
            <Tooltip>
              <TooltipTrigger asChild>
                <m.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={quickSpring}
                >
                  <Link
                    href="/auth/signin"
                    aria-label="Sign in with Google"
                    className={cn(
                      NAV_ICON_BOX,
                      "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring focus-visible:ring-offset-background shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    )}
                  >
                    <LogIn className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  </Link>
                </m.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                <p className="text-xs font-medium">Sign in with Google</p>
              </TooltipContent>
            </Tooltip>
          </m.div>
        )}
      </m.div>

      {/* Spacer: write pages use their own top toolbar aligned with fixed chrome */}
      <div
        className={
          pathname === "/write" ||
          pathname === "/csi/write" ||
          pathname === "/tech-weekly/write"
            ? "h-0"
            : "h-20"
        }
        aria-hidden
      />
    </LazyMotion>
  );
}
