"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsMenu } from "@/components/layout/header/NotificationsMenu";
import { UserMenu } from "@/components/layout/header/UserMenu";
import { SearchPalette } from "@/components/search/SearchPalette";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { UserCapabilities } from "@/lib/roles";
import { cn } from "@/lib/utils";

type ProfileSummary = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_admin: boolean;
  csi_id: number | null;
} | null;

export function HeaderActions({
  signedIn,
  profile,
  capabilities,
  variant = "bar",
}: {
  signedIn: boolean;
  profile: ProfileSummary;
  capabilities: UserCapabilities;
  variant?: "bar" | "dock";
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const bar = variant === "bar";

  return (
    <>
      <ThemeToggle />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground",
        )}
        aria-label="Search (⌘K)"
        onClick={() => setSearchOpen(true)}
      >
        <Search className="h-4 w-4" strokeWidth={1.75} />
      </Button>

      {signedIn ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={bar ? "outline" : "default"}
                className="ml-0.5 hidden h-9 gap-1.5 px-3 text-xs font-medium sm:inline-flex"
              >
                <PenSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                Write
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52" data-lenis-prevent>
              {capabilities.canWriteJournal && (
                <DropdownMenuItem asChild>
                  <Link href="/write">Journal piece</Link>
                </DropdownMenuItem>
              )}
              {capabilities.canWriteTech && (
                <DropdownMenuItem asChild>
                  <Link href="/tech-weekly/write">Tech Weekly dispatch</Link>
                </DropdownMenuItem>
              )}
              {!capabilities.canWriteTech && (
                <DropdownMenuItem asChild>
                  <Link href="/verify-csi">Verify CSI for Tech Weekly</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationsMenu userId={profile?.id} />
          <UserMenu profile={profile} capabilities={capabilities} />
        </>
      ) : (
        <Button
          asChild
          size="sm"
          variant={bar ? "outline" : "default"}
          className="ml-0.5 h-9 px-3.5 text-xs font-medium"
        >
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      )}

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
