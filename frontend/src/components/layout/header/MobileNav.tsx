"use client";

import Link from "next/link";
import { Menu, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HeaderNav } from "@/components/layout/header/HeaderNav";
import type { UserCapabilities } from "@/lib/roles";
import { useState } from "react";

type ProfileSummary = {
  username: string;
  full_name: string | null;
} | null;

export function MobileNav({
  signedIn,
  profile,
  capabilities,
}: {
  signedIn: boolean;
  profile: ProfileSummary;
  capabilities: UserCapabilities;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[340px]">
        <SheetHeader>
          <SheetTitle className="font-display text-left text-lg">
            Menu
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <HeaderNav signedIn={signedIn} className="flex flex-col items-stretch gap-1" />

          {signedIn ? (
            <div className="space-y-1 border-t border-hairline pt-4">
              {capabilities.canWriteJournal && (
                <Link
                  href="/write"
                  onClick={close}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface"
                >
                  <PenSquare className="h-4 w-4" />
                  Write Journal piece
                </Link>
              )}
              {capabilities.canWriteTech && (
                <Link
                  href="/tech-weekly/write"
                  onClick={close}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface"
                >
                  <PenSquare className="h-4 w-4" />
                  Write Tech dispatch
                </Link>
              )}
              <Link
                href="/dashboard"
                onClick={close}
                className="block rounded-md px-3 py-2 text-sm hover:bg-surface"
              >
                Studio
              </Link>
              {profile?.username && (
                <Link
                  href={`/profile/${profile.username}`}
                  onClick={close}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-surface"
                >
                  Profile
                </Link>
              )}
              <Link
                href="/settings"
                onClick={close}
                className="block rounded-md px-3 py-2 text-sm hover:bg-surface"
              >
                Settings
              </Link>
              {capabilities.isAdmin && (
                <Link
                  href="/admin"
                  onClick={close}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-surface"
                >
                  Admin
                </Link>
              )}
            </div>
          ) : (
            <Button asChild className="w-full" onClick={close}>
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
