"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Menu,
  BookOpen,
  PenTool,
  User,
  LogOut,
  Settings,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Bell,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  NotificationWithSender,
} from "@/features/notifications/notifications";
import { formatRelativeTime } from "@/lib/utils";
import { motionEase, springSnappy } from "@/lib/motion";

export function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([]);
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
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Explore", href: "/explore", icon: BookOpen },
    { name: "Write", href: "/write", icon: PenTool },
  ];

  const isActive = (href: string) => pathname === href;

  const pillSpring = {
    type: "spring",
    stiffness: 700,
    damping: 30,
  };

  const quickSpring = springSnappy;

  return (
    <TooltipProvider delayDuration={0}>
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
                className="flex items-center justify-center w-11 h-11 rounded-full bg-card shadow-lg ring-2 ring-border border border-border/60"
              >
                <span className="text-xl leading-none" aria-hidden>
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
          className={`flex items-center gap-0.5 px-1.5 py-1.5 rounded-full backdrop-blur-xl pointer-events-auto transition-shadow duration-200 ${scrolled
            ? "shadow-xl bg-card/90 border border-border/70"
            : "shadow-lg bg-card/85 border border-border/50"
            }`}
        >
          {/* Explore */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/explore"
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-150 ${isActive("/explore")
                  ? "text-primary"
                  : "text-foreground/80 hover:text-foreground dark:text-foreground/85 dark:hover:text-foreground"
                  }`}
              >
                {isActive("/explore") && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 rounded-full bg-primary/15 ring-1 ring-primary/20"
                    transition={pillSpring}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.2, rotate: -8 }}
                  whileTap={{ scale: 0.85 }}
                  transition={quickSpring}
                  className="relative z-10"
                >
                  <BookOpen
                    className="w-[18px] h-[18px]"
                    strokeWidth={isActive("/explore") ? 2.5 : 2}
                  />
                </motion.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
              <p className="text-xs font-medium">Explore</p>
            </TooltipContent>
          </Tooltip>

          {/* Write */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/write"
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-150 ${isActive("/write")
                  ? "text-primary"
                  : "text-foreground/80 hover:text-foreground dark:text-foreground/85 dark:hover:text-foreground"
                  }`}
              >
                {isActive("/write") && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 rounded-full bg-primary/15 ring-1 ring-primary/20"
                    transition={pillSpring}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 8 }}
                  whileTap={{ scale: 0.85 }}
                  transition={quickSpring}
                  className="relative z-10"
                >
                  <PenTool
                    className="w-[18px] h-[18px]"
                    strokeWidth={isActive("/write") ? 2.5 : 2}
                  />
                </motion.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
              <p className="text-xs font-medium">Write</p>
            </TooltipContent>
          </Tooltip>

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden ml-0.5">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={quickSpring}
                className="flex items-center justify-center w-10 h-10 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/10 dark:text-foreground/85 transition-colors duration-150"
              >
                <Menu className="w-[18px] h-[18px]" strokeWidth={2} />
              </motion.button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 rounded-l-3xl bg-card/97 backdrop-blur-xl border-l border-border/60 p-0 shadow-2xl"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 p-5 border-b border-border/60 bg-muted/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted ring-2 ring-border">
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
                  {navigation.map((item) => (
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

      {/* Right - Profile Pill (centered vertically with nav) */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: motionEase, delay: 0.05 }}
        className="fixed top-4 right-4 z-50 hidden md:flex items-center"
      >
        {!isClient || loading ? (
          <div className="h-11 w-11 rounded-full bg-muted animate-pulse" />
        ) : user ? (
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={quickSpring}
                className="relative flex items-center justify-center p-0.5 rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-lg"
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-card">
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
                  {/* Notification Badge */}
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold ring-2 ring-background"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={12}
              className="w-72 rounded-xl border border-border shadow-lg bg-popover p-0 overflow-hidden"
            >
              {/* Profile Header */}
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

              {/* Navigation Items */}
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
                    href={
                      profile?.username
                        ? `/profile/${profile.username}`
                        : "/profile"
                    }
                    className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-lg"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/notifications"
                    className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-lg"
                  >
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
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

              {/* Sign Out */}
              <div className="p-1.5">
                <DropdownMenuItem
                  onClick={signOut}
                  className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-lg text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <motion.div
            layout
            transition={quickSpring}
            className="flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-card border border-border/60 shadow-lg"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  transition={quickSpring}
                >
                  <Link
                    href="/auth/signin"
                    className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors duration-150"
                  >
                    <LogIn className="w-[18px] h-[18px]" strokeWidth={2} />
                  </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={10}>
                <p className="text-xs font-medium">Sign In</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={quickSpring}
                >
                  <Link
                    href="/auth/signup"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 shadow-md"
                  >
                    <UserPlus className="w-[18px] h-[18px]" strokeWidth={2} />
                  </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={10}>
                <p className="text-xs font-medium">Get Started</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </motion.div>

      {/* Spacer */}
      <div className="h-20" />
    </TooltipProvider>
  );
}
