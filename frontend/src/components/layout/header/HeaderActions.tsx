"use client";

import Link from "next/link";
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
import type { UserCapabilities } from "@/lib/roles";
import { useState } from "react";

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
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-foreground"
        aria-label="Search"
        onClick={() => setSearchOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      {signedIn ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hidden h-9 gap-1.5 px-2.5 text-sm sm:inline-flex"
              >
                <PenSquare className="h-3.5 w-3.5" />
                Write
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
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
        <Button asChild size="sm" className="h-9 rounded-md px-3 text-sm">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      )}

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
