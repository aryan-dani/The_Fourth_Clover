"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, PenSquare, Terminal, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserCapabilities } from "@/lib/roles";

const ITEMS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/journal",
    label: "Journal",
    icon: BookOpen,
    match: (p: string) =>
      p === "/journal" ||
      p.startsWith("/journal/") ||
      p.startsWith("/post/") ||
      p.startsWith("/tags"),
  },
  {
    href: "/tech-weekly",
    label: "Tech",
    icon: Terminal,
    match: (p: string) => p.startsWith("/tech-weekly"),
  },
  {
    href: "/following",
    label: "Following",
    icon: Users,
    auth: true,
    match: (p: string) =>
      p === "/following" || p.startsWith("/explore/following"),
  },
] as const;

export function MobileDock({
  signedIn,
  capabilities,
}: {
  signedIn: boolean;
  capabilities: UserCapabilities;
}) {
  const pathname = usePathname() || "/";
  const writeHref = capabilities.canWriteTech
    ? "/tech-weekly/write"
    : capabilities.canWriteJournal
      ? "/write"
      : "/auth/signin";

  const links = ITEMS.filter((item) => !("auth" in item && item.auth) || signedIn);

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden"
      aria-label="Mobile dock"
    >
      <div className="pointer-events-auto mx-3 mb-3 rounded-2xl border border-hairline bg-card px-1.5 py-1.5 shadow-[0_8px_28px_rgb(0_0_0/0.1)] dark:shadow-[0_8px_28px_rgb(0_0_0/0.4)]">
        <ul className="flex items-stretch justify-between gap-0.5">
          {links.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <li key={item.href} className="min-w-0 flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-colors duration-editorial",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
                  <span className="truncate text-[10px] font-medium tracking-wide">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0 flex-1">
            <Link
              href={signedIn ? writeHref : "/auth/signin"}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-colors duration-editorial",
                pathname.startsWith("/write") ||
                  pathname.startsWith("/tech-weekly/write")
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <PenSquare className="h-4 w-4" strokeWidth={1.75} />
              <span className="truncate text-[10px] font-medium tracking-wide">
                Write
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
