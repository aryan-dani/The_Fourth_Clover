"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
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
} from "@/lib/notifications";
import { formatRelativeTime } from "@/lib/utils";

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

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const [notifResult, count] = await Promise.all([
        getNotifications(user.id, 20),
        getUnreadCount(user.id),
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
  }, [user]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

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

  const quickSpring = {
    type: "spring",
    stiffness: 500,
    damping: 25,
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Left - Logo */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 left-4 z-50"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/" className="group">
              <motion.div
                whileHover={{ scale: 1.15, rotate: 8 }}
                whileTap={{ scale: 0.92 }}
                transition={quickSpring}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground shadow-lg"
              >
                <span className="text-base text-background">🍀</span>
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
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none"
      >
        <motion.nav
          layout
          transition={quickSpring}
          className={`flex items-center gap-0.5 px-1.5 py-1.5 rounded-full backdrop-blur-xl pointer-events-auto transition-shadow duration-200 ${scrolled
            ? "shadow-xl bg-background border border-border/60"
            : "shadow-lg bg-background/95 border border-border/40"
            }`}
        >
          {/* Explore */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/explore"
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-150 ${isActive("/explore")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {isActive("/explore") && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-foreground/10 rounded-full"
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
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {isActive("/write") && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-foreground/10 rounded-full"
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
                className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors duration-150"
              >
                <Menu className="w-[18px] h-[18px]" strokeWidth={2} />
              </motion.button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 rounded-l-3xl bg-background/95 backdrop-blur-xl border-l border-border/50 p-0"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 p-5 border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                    <span className="text-lg text-background">🍀</span>
                  </div>
                  <div>
                    <span className="font-semibold">The Fourth Clover</span>
                    <p className="text-xs text-muted-foreground">Navigation</p>
                  </div>
                </div>

                <nav className="flex flex-col p-3 gap-1">
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === "/"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                  >
                    <span className="text-lg">🍀</span>
                    <span className="font-medium">Home</span>
                  </Link>
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive(item.href)
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
                      className="w-full rounded-2xl h-12 bg-foreground text-background hover:bg-foreground/90"
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
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
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
                className="relative flex items-center justify-center p-0.5 rounded-full bg-gradient-to-br from-foreground/20 via-foreground/10 to-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-lg"
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-background">
                    <AvatarImage
                      src={
                        profile?.avatar_url || user.user_metadata?.avatar_url
                      }
                    />
                    <AvatarFallback className="bg-foreground text-background font-bold text-sm">
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
                    <AvatarFallback className="bg-foreground text-background font-bold text-sm">
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
            className="flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-background border border-border/50 shadow-lg"
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
                    className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors duration-150"
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
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors duration-150"
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
