"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, PenSquare } from "lucide-react";
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
}: {
  signedIn: boolean;
  profile: ProfileSummary;
  capabilities: UserCapabilities;
  variant?: "bar" | "dock";
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="nav-actions">
        <ThemeToggle />
        <button
          type="button"
          className="nav-icon"
          aria-label="Search (⌘K)"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <span className="nav-actions-divider" aria-hidden />

        {signedIn ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="nav-cta hidden sm:inline-flex">
                  <PenSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Write</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52"
                data-lenis-prevent
              >
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
          <Link href="/auth/signin" className="nav-cta">
            <span>Sign in</span>
          </Link>
        )}
      </div>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
