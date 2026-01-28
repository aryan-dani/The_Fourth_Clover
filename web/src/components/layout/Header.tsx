"use client";

import { useState, useEffect } from "react";
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
  Search,
  PenTool,
  User,
  LogOut,
  Settings,
  LogIn,
  UserPlus,
  LayoutDashboard,
  ChevronRight,
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
import { NotificationBell } from "@/components/ui/NotificationBell";

export function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Explore", href: "/explore", icon: Search },
    { name: "Write", href: "/write", icon: PenTool },
  ];

  const isActive = (href: string) => pathname === href;

  const pillSpring = {
    type: "spring",
    stiffness: 500,
    damping: 30
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Center - Navigation Pill with Logo in the middle */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none"
      >
        <motion.nav
          layout
          className={`flex items-center gap-0.5 px-1.5 py-1.5 rounded-full backdrop-blur-xl pointer-events-auto transition-all duration-500 ${scrolled
              ? "shadow-xl bg-background/95 border border-border/50"
              : "shadow-lg bg-background/80 border border-border/30"
            }`}
        >
          {/* Explore */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/explore"
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isActive("/explore")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {isActive("/explore") && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-accent rounded-full"
                    transition={pillSpring}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative z-10"
                >
                  <Search className="w-[18px] h-[18px]" strokeWidth={isActive("/explore") ? 2.2 : 1.8} />
                </motion.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
              <p className="text-xs font-medium">Explore</p>
            </TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="w-px h-5 bg-border/50 mx-0.5" />

          {/* Logo in Center */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/" className="group">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={pillSpring}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground mx-0.5"
                >
                  <span className="text-base text-background">🍀</span>
                </motion.div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
              <p className="text-xs font-medium">Home</p>
            </TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="w-px h-5 bg-border/50 mx-0.5" />

          {/* Write */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/write"
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isActive("/write")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {isActive("/write") && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-accent rounded-full"
                    transition={pillSpring}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative z-10"
                >
                  <PenTool className="w-[18px] h-[18px]" strokeWidth={isActive("/write") ? 2.2 : 1.8} />
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <Menu className="w-[18px] h-[18px]" strokeWidth={1.8} />
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
                    <Button asChild variant="outline" className="w-full rounded-2xl h-12">
                      <Link href="/auth/signin" onClick={() => setIsOpen(false)}>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild className="w-full rounded-2xl h-12 bg-foreground text-background hover:bg-foreground/90">
                      <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
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
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="fixed top-4 right-4 z-50 hidden md:flex items-center"
      >
        {!isClient || loading ? (
          <div className="h-[52px] w-24 rounded-full bg-muted animate-pulse" />
        ) : user ? (
          <motion.div
            layout
            className="flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-background/80 backdrop-blur-xl border border-border/40 shadow-lg"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <NotificationBell />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={10}>
                <p className="text-xs font-medium">Notifications</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-9 h-9 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                >
                  <Avatar className="w-8 h-8 ring-2 ring-background">
                    <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-foreground text-background font-semibold text-xs">
                      {profile?.full_name?.[0] || user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-64 rounded-2xl border border-border/50 shadow-2xl bg-popover/98 backdrop-blur-xl p-0 overflow-hidden"
              >
                <div className="px-4 py-4 bg-gradient-to-b from-accent/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-11 h-11 ring-2 ring-background shadow-lg">
                      <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-foreground text-background font-semibold">
                        {profile?.full_name?.[0] || user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {profile?.full_name || user.user_metadata?.full_name || "Writer"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{profile?.username || "user"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center justify-between py-2.5 px-3 cursor-pointer rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center group-hover:bg-accent transition-colors">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Dashboard</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={profile?.username ? `/profile/${profile.username}` : "/profile"}
                      className="flex items-center justify-between py-2.5 px-3 cursor-pointer rounded-xl group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center group-hover:bg-accent transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Profile</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/write" className="flex items-center justify-between py-2.5 px-3 cursor-pointer rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center group-hover:bg-accent transition-colors">
                          <PenTool className="w-4 h-4" />
                        </div>
                        <span className="font-medium">New Post</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2 bg-border/50" />

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center justify-between py-2.5 px-3 cursor-pointer rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center group-hover:bg-accent transition-colors">
                          <Settings className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Settings</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2 bg-border/50" />

                  <DropdownMenuItem
                    onClick={signOut}
                    className="flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-xl text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-background/80 backdrop-blur-xl border border-border/40 shadow-lg"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/auth/signin"
                    className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                  >
                    <LogIn className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={10}>
                <p className="text-xs font-medium">Sign In</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/auth/signup"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200"
                  >
                    <UserPlus className="w-[18px] h-[18px]" strokeWidth={1.8} />
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
