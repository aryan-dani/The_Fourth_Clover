"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
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

function notificationItemHref(n: NotificationWithSender): string {
  if (n.type === "follow" && n.from_user?.username) {
    return `/profile/${encodeURIComponent(n.from_user.username)}`;
  }
  return "/notifications";
}

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
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [navPendingHref, setNavPendingHref] = useState<string | null>(null);
  const pathname = usePathname();

  const userId = user?.id;

  const handleMainNavClick = useCallback((href: string) => {
    if (pathname !== href) setNavPendingHref(href);
  }, [pathname]);

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

  const primaryNav: {
    name: string;
    href: string;
    icon: typeof BookOpen;
  }[] = [
    { name: "Explore", href: "/explore", icon: BookOpen },
    ...(user
      ? [{ name: "Following", href: "/explore/following", icon: Users }]
      : []),
    { name: "Write", href: "/write", icon: PenTool },
  ];

  const isActive = (href: string) => pathname === href;
  const isExploreActive = pathname === "/explore";
  const isFollowingActive = pathname === "/explore/following";

  const pillSpring = {
    type: "spring",
    stiffness: 700,
    damping: 30,
  };

  const quickSpring = springSnappy;

  return (
    <>
      {/* Left - Logo */}
      <motion.header
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: motionEase }}
        className="fixed top-4 left-4 z-50"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/" className="group" aria-label="Home">
              <motion.div
                whileHover={{ scale: 1.08, rotate: -4 }}
                whileTap={{ scale: 0.94 }}
                transition={quickSpring}
                className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-border/60 bg-card shadow-lg ring-1 ring-border"
              >
                <span className="text-lg leading-none" aria-hidden>
                  🍀
                </span>
              </motion.div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={10}>
            <p className="text-xs font-medium">Home</p>
          </TooltipContent>
        </Tooltip>
      </motion.header>

      {/* Center - Navigation Pill */}
      <motion.header
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: motionEase }}
        className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none"
      >
        <motion.nav
          layout
          transition={quickSpring}
          className={cn(
            NAV_PILL_SHELL,
            "pointer-events-auto gap-1 px-1 shadow-lg transition-shadow duration-200",
            scrolled
              ? "border-border/70 bg-card/90 shadow-xl"
              : "border-border/50 bg-card/85"
          )}
        >
          {/* Explore */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/explore"
                onClick={() => handleMainNavClick("/explore")}
                className={cn(
                  NAV_ICON_BOX,
                  "relative transition-all duration-150",
                  navPendingHref === "/explore" && pathname !== "/explore"
                    ? "opacity-55"
                    : "",
                  isExploreActive
                    ? "text-primary"
                    : "text-foreground/80 hover:text-foreground dark:text-foreground/85 dark:hover:text-foreground"
                )}
              >
                {isExploreActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 rounded-full bg-primary/15 ring-1 ring-inset ring-primary/25"
                    transition={pillSpring}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  transition={quickSpring}
                  className="relative z-10"
                >
                  <BookOpen
                    className={NAV_ICON_CLASS}
                    strokeWidth={NAV_STROKE}
                  />
                </motion.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
              <p className="text-xs font-medium">Explore</p>
            </TooltipContent>
          </Tooltip>

          {/* Following (signed in) */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/explore/following"
                  onClick={() => handleMainNavClick("/explore/following")}
                  className={cn(
                    NAV_ICON_BOX,
                    "relative transition-all duration-150",
                    navPendingHref === "/explore/following" &&
                      pathname !== "/explore/following"
                      ? "opacity-55"
                      : "",
                    isFollowingActive
                      ? "text-primary"
                      : "text-foreground/80 hover:text-foreground dark:text-foreground/85 dark:hover:text-foreground"
                  )}
                >
                  {isFollowingActive && (
                    <motion.div
                      layoutId="activeNavBg"
                      className="absolute inset-0 rounded-full bg-primary/15 ring-1 ring-inset ring-primary/25"
                      transition={pillSpring}
                    />
                  )}
                  <motion.div
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    transition={quickSpring}
                    className="relative z-10"
                  >
                    <Users className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  </motion.div>
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
                href="/write"
                onClick={() => handleMainNavClick("/write")}
                className={cn(
                  NAV_ICON_BOX,
                  "relative transition-all duration-150",
                  navPendingHref === "/write" && pathname !== "/write"
                    ? "opacity-55"
                    : "",
                  isActive("/write")
                    ? "text-primary"
                    : "text-foreground/80 hover:text-foreground dark:text-foreground/85 dark:hover:text-foreground"
                )}
              >
                {isActive("/write") && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 rounded-full bg-primary/15 ring-1 ring-inset ring-primary/25"
                    transition={pillSpring}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  transition={quickSpring}
                  className="relative z-10"
                >
                  <PenTool className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                </motion.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
              <p className="text-xs font-medium">Write</p>
            </TooltipContent>
          </Tooltip>

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden ml-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={quickSpring}
                className={cn(
                  NAV_ICON_BOX,
                  "text-foreground/80 transition-colors duration-150 hover:bg-muted/90 hover:text-foreground dark:text-foreground/85"
                )}
              >
                <Menu className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
              </motion.button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 rounded-l-3xl bg-card/97 backdrop-blur-xl border-l border-border/60 p-0 shadow-2xl"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <SheetDescription className="sr-only">
                Site sections, theme, notifications, and sign-in links.
              </SheetDescription>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 p-5 border-b border-border/60 bg-muted/40">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-muted ring-2 ring-border">
                  <span className="text-2xl leading-none" aria-hidden>
                    🍀
                  </span>
                </div>
                  <div>
                    <span className="font-display font-semibold text-foreground">The Fourth Clover</span>
                    <p className="text-xs text-muted-foreground font-sans">Navigation</p>
                  </div>
                </div>

                <nav className="flex flex-col p-3 gap-1">
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-sans ${pathname === "/"
                      ? "bg-primary/12 text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                  >
                    <span className="text-2xl leading-none mr-1" aria-hidden>
                      🍀
                    </span>
                    <span className="font-medium">Home</span>
                  </Link>
                  {primaryNav.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-sans ${isActive(item.href)
                        ? "bg-primary/12 text-primary ring-1 ring-primary/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                    >
                      <item.icon className="w-5 h-5" strokeWidth={1.8} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                </nav>

                {user && (
                  <div className="px-3 pb-3 space-y-2 border-b border-border/50">
                    <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Appearance & alerts
                    </p>
                    <div className="flex items-center gap-2 px-2">
                      <ThemeToggle />
                      <span className="text-sm text-muted-foreground">Theme</span>
                    </div>
                    <Link
                      href="/notifications"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    >
                      <Bell className="w-5 h-5" strokeWidth={1.8} />
                      <span className="font-medium">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </div>
                )}

                {!user && (
                  <div className="mt-auto p-4 border-t border-border/50 space-y-2">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-2xl h-12"
                    >
                      <Link
                        href="/auth/signin"
                        onClick={() => setIsOpen(false)}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full rounded-2xl h-12"
                    >
                      <Link
                        href="/auth/signup"
                        onClick={() => setIsOpen(false)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </motion.nav>
      </motion.header>

      {/* Right — theme | notifications | account (aligned segmented bar) */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: motionEase, delay: 0.05 }}
        className="fixed top-4 right-4 z-50 hidden md:flex h-[52px] items-center"
      >
        {!isClient || loading ? (
          <div
            className={cn(
              NAV_PILL_SHELL,
              "w-44 animate-pulse border-border/50 bg-muted px-1 shadow-none"
            )}
          />
        ) : user ? (
          <div
            className={cn(
              NAV_PILL_SHELL,
              "gap-0 border-border/70 bg-card/95 px-1 shadow-md dark:bg-card/90 dark:shadow-black/20"
            )}
            role="toolbar"
            aria-label="Account and settings"
          >
            <ThemeToggle />
            <span className={NAV_PILL_DIVIDER} aria-hidden />
            <Popover open={notifPopoverOpen} onOpenChange={setNotifPopoverOpen}>
              <PopoverTrigger asChild>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={quickSpring}
                  className={cn(
                    NAV_ICON_BOX,
                    "relative text-foreground/85 transition-colors hover:bg-muted/90 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                  aria-label="Notifications"
                >
                  <Bell className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-card shadow-sm">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </motion.button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={10}
                className="w-[min(24rem,calc(100vw-2rem))] p-0 rounded-2xl border-border/80 shadow-xl"
              >
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm">Notifications</p>
                  {unreadCount > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs rounded-lg"
                      onClick={async () => {
                        if (!userId) return;
                        await markAllAsRead(userId);
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true }))
                        );
                        setUnreadCount(0);
                      }}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[min(22rem,50vh)]">
                  {notifLoading && notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      Loading…
                    </p>
                  ) : notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      You&apos;re all caught up.
                    </p>
                  ) : (
                    <ul className="p-1">
                      {notifications.map((n) => {
                        const IconCmp = n.from_user
                          ? null
                          : notificationIconForType(n.type);
                        const href = notificationItemHref(n);
                        return (
                          <li key={n.id}>
                            <Link
                              href={href}
                              className={`flex gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/80 ${!n.read ? "bg-primary/5" : ""}`}
                              onClick={async () => {
                                if (!n.read) {
                                  await markAsRead(n.id);
                                  setNotifications((prev) =>
                                    prev.map((x) =>
                                      x.id === n.id ? { ...x, read: true } : x
                                    )
                                  );
                                  setUnreadCount((c) => Math.max(0, c - 1));
                                }
                                setNotifPopoverOpen(false);
                              }}
                            >
                              <div className="shrink-0 mt-0.5">
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
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                    <IconCmp className="h-4 w-4 text-primary" />
                                  </div>
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm leading-snug line-clamp-3">
                                  {n.message}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  {formatRelativeTime(n.created_at)}
                                </p>
                              </div>
                              {!n.read && (
                                <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </ScrollArea>
                <div className="border-t border-border p-2">
                  <Button variant="ghost" size="sm" className="w-full rounded-xl" asChild>
                    <Link href="/notifications" onClick={() => setNotifPopoverOpen(false)}>
                      View all notifications
                    </Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <span className={NAV_PILL_DIVIDER} aria-hidden />

            <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={quickSpring}
                  className={cn(
                    NAV_ICON_BOX,
                    "bg-gradient-to-br from-primary/20 via-primary/8 to-transparent ring-1 ring-border/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-background">
                    <AvatarImage
                      src={
                        profile?.avatar_url || user.user_metadata?.avatar_url
                      }
                    />
                    <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                      {profile?.full_name?.[0] ||
                        user.user_metadata?.full_name?.[0] ||
                        user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-72 rounded-xl border border-border shadow-lg bg-popover p-0 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={
                          profile?.avatar_url || user.user_metadata?.avatar_url
                        }
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                        {profile?.full_name?.[0] ||
                          user.user_metadata?.full_name?.[0] ||
                          user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {profile?.full_name ||
                          user.user_metadata?.full_name ||
                          "Writer"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{profile?.username || "user"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-1.5 border-b border-border">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-lg"
                    >
                      <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-lg"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Edit profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-lg"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </div>

                <div className="p-1.5">
                  <DropdownMenuItem
                    onClick={signOut}
                    className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-lg text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <motion.div
            layout
            transition={quickSpring}
            className={cn(
              NAV_PILL_SHELL,
              "gap-0 border-border/70 bg-card/95 px-1 shadow-md dark:bg-card/90 dark:shadow-black/20"
            )}
            role="toolbar"
            aria-label="Sign in and appearance"
          >
            <ThemeToggle />
            <span className={NAV_PILL_DIVIDER} aria-hidden />
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={quickSpring}
                >
                  <Link
                    href="/auth/signin"
                    className={cn(
                      NAV_ICON_BOX,
                      "text-foreground/85 transition-colors hover:bg-muted/90 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    )}
                  >
                    <LogIn className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                <p className="text-xs font-medium">Sign in</p>
              </TooltipContent>
            </Tooltip>
            <span className={NAV_PILL_DIVIDER} aria-hidden />
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={quickSpring}
                >
                  <Link
                    href="/auth/signup"
                    className={cn(
                      NAV_ICON_BOX,
                      "bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    )}
                  >
                    <UserPlus className={NAV_ICON_CLASS} strokeWidth={NAV_STROKE} />
                  </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                <p className="text-xs font-medium">Get started</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </motion.div>

      {/* Spacer: write page uses its own top toolbar aligned with fixed chrome */}
      <div className={pathname === "/write" ? "h-0" : "h-20"} aria-hidden />
    </>
  );
}
