"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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

  // Ensure we only render auth UI on client to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Track scroll for subtle shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Only Explore and Write - Home is handled by logo click
  const navigation = [
    { name: "Explore", href: "/explore", icon: Search },
    { name: "Write", href: "/write", icon: PenTool },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      {/* Corner Logo - Absolute Position */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-4 left-4 z-50"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/" className="group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <span className="text-xl text-background">🍀</span>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-foreground/20"
                />
              </motion.div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="rounded-full px-3 py-1.5">
            <p className="text-xs font-medium">Home</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>

      {/* Floating Center Navbar - Truly Centered */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none"
      >
        <motion.nav
          className={`flex items-center gap-1 px-3 py-2 rounded-full floating-nav transition-all duration-300 pointer-events-auto ${scrolled ? "shadow-xl" : ""
            }`}
        >
          {/* Desktop Navigation Icons */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                    >
                      <item.icon className="w-5 h-5" />
                    </Link>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="rounded-full px-3 py-1.5">
                  <p className="text-xs font-medium">{item.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Separator */}
          <div className="hidden md:block w-px h-6 bg-border/50 mx-1" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Separator */}
          <div className="hidden md:block w-px h-6 bg-border/50 mx-1" />

          {/* Auth Section */}
          {!isClient || loading ? (
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted/50 transition-colors focus-ring"
                  >
                    <Avatar className="w-8 h-8 ring-2 ring-background shadow-md">
                      <AvatarImage
                        src={
                          profile?.avatar_url || user.user_metadata?.avatar_url
                        }
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm">
                        {profile?.full_name?.[0] ||
                          user.user_metadata?.full_name?.[0] ||
                          user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-2xl border-0 shadow-2xl bg-card/95 backdrop-blur-xl mt-2"
                >
                  <div className="px-3 py-3 border-b border-border/50">
                    <p className="text-sm font-semibold">
                      {profile?.full_name ||
                        user.user_metadata?.full_name ||
                        "Writer"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      @{profile?.username || user.user_metadata?.username || "user"}
                    </p>
                  </div>
                  <div className="p-1">
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 py-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors">
                      <Link
                        href={profile?.username ? `/profile/${profile.username}` : "/profile"}
                        className="flex items-center gap-3 py-2"
                      >
                        <User className="w-4 h-4" />
                        <span className="font-medium">Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors">
                      <Link
                        href="/write"
                        className="flex items-center gap-3 py-2"
                      >
                        <PenTool className="w-4 h-4" />
                        <span className="font-medium">Write</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors">
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 py-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="font-medium">Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50 my-1" />
                  <div className="p-1">
                    <DropdownMenuItem
                      onClick={signOut}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-xl flex items-center gap-3 py-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/auth/signin"
                      className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                    >
                      <LogIn className="w-5 h-5" />
                    </Link>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="rounded-full px-3 py-1.5">
                  <p className="text-xs font-medium">Sign In</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/auth/signup"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 shadow-md"
                    >
                      <UserPlus className="w-5 h-5" />
                    </Link>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="rounded-full px-3 py-1.5">
                  <p className="text-xs font-medium">Get Started</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 rounded-l-3xl border-0 bg-card/95 backdrop-blur-xl"
            >
              <div className="flex flex-col space-y-6 mt-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center">
                    <span className="text-lg text-background">🍀</span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Menu</div>
                  </div>
                </div>

                <nav className="flex flex-col space-y-2">
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
                  >
                    <span className="text-lg">🍀</span>
                    Home
                  </Link>
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {!user && (
                  <div className="flex flex-col space-y-3 pt-6 border-t border-border">
                    <Button asChild variant="outline" className="rounded-full">
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
                      className="rounded-full bg-foreground text-background"
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

      {/* Spacer for fixed header - prevents content from going under navbar */}
      <div className="h-20" />
    </TooltipProvider>
  );
}
