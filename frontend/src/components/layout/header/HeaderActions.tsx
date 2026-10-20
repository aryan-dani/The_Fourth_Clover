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

const iconBtn =
  "h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-surface hover:text-foreground";

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
        className={iconBtn}
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
                className={cn(
                  "ml-0.5 hidden h-8 gap-1.5 rounded-full px-3 text-xs font-medium sm:inline-flex",
                )}
              >
                <PenSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
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
        <Button
          asChild
          size="sm"
          className="ml-0.5 h-8 rounded-full px-3.5 text-xs font-medium"
        >
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      )}

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
