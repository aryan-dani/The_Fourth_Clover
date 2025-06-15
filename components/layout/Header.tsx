"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import {
  Menu,
  Search,
  PenTool,
  Home,
  User,
  LogOut,
  Settings,
  ArrowRight,
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

export function Header() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Search },
    { name: "Write", href: "/write", icon: PenTool },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-4 group">
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
          <div className="hidden sm:block">
            <div className="brand-text text-lg lg:text-xl tracking-tight group-hover:text-primary transition-colors">
              THE FOURTH CLOVER
            </div>
            <div className="text-xs text-muted-foreground font-light ui-text">
              Minimalist Writing Platform
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {navigation.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 group ui-text"
              >
                <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {item.name}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-3 p-2 rounded-full hover:bg-muted/50 transition-colors focus-ring"
                >
                  <Avatar className="w-10 h-10 ring-2 ring-background shadow-lg">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                      {user.user_metadata?.full_name?.[0] ||
                        user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">
                      {user.user_metadata?.full_name || "Writer"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{user.user_metadata?.username || "user"}
                    </p>
                  </div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl border-0 shadow-2xl bg-card/80 backdrop-blur-xl"
              >
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link
                    href="/write"
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <PenTool className="w-4 h-4" />
                    Write
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-destructive focus:text-destructive cursor-pointer rounded-xl flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild className="rounded-full">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/auth/signup">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 rounded-l-3xl border-0 bg-card/95 backdrop-blur-xl"
            >
              <div className="flex flex-col space-y-6 mt-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center">
                    <span className="text-sm text-background">🍀</span>
                  </div>
                  <div>
                    <div className="brand-text text-base">
                      THE FOURTH CLOVER
                    </div>
                    <div className="text-xs text-muted-foreground">Menu</div>
                  </div>
                </div>

                <nav className="flex flex-col space-y-2">
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
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
