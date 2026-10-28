"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Shield,
  ClipboardCheck,
  User,
  BookMarked,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/auth-context";
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

export function UserMenu({
  profile,
  capabilities,
}: {
  profile: ProfileSummary;
  capabilities: UserCapabilities;
}) {
  const { signOut } = useAuth();
  const router = useRouter();
  const name = profile?.full_name || profile?.username || "Account";
  const initial = name.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Avatar className="h-8 w-8 ring-1 ring-hairline">
            <AvatarImage src={profile?.avatar_url || ""} alt="" />
            <AvatarFallback className="bg-surface font-mono text-[11px]">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1 font-normal">
          <p className="font-sans text-sm font-medium text-foreground">{name}</p>
          <p className="type-label text-muted-foreground">
            {(capabilities.role ?? "guest").replace("_", " ")}
            {profile?.csi_id ? ` · CSI #${profile.csi_id}` : ""}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profile?.username && (
          <DropdownMenuItem asChild>
            <Link href={`/profile/${profile.username}`}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Studio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/reading-list">
            <BookMarked className="mr-2 h-4 w-4" />
            Reading list
          </Link>
        </DropdownMenuItem>
        {capabilities.canReview && (
          <DropdownMenuItem asChild>
            <Link href="/tech-weekly/review">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Review queue
            </Link>
          </DropdownMenuItem>
        )}
        {capabilities.isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="mr-2 h-4 w-4" />
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
