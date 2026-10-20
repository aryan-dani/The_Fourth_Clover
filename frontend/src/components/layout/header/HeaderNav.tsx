"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    href: "/journal",
    label: "Journal",
    match: ["/journal", "/explore", "/post", "/tags"],
  },
  {
    href: "/tech-weekly",
    label: "Tech Weekly",
    match: ["/tech-weekly"],
  },
  {
    href: "/following",
    label: "Following",
    match: ["/following", "/explore/following"],
    auth: true,
  },
] as const;

export function HeaderNav({
  signedIn,
  className,
  variant = "dock",
}: {
  signedIn: boolean;
  className?: string;
  variant?: "dock" | "stack";
}) {
  const pathname = usePathname() || "/";
  const isStack = variant === "stack";

  return (
    <nav
      className={cn(
        isStack ? "flex flex-col items-stretch gap-1" : "items-center gap-0.5",
        className,
      )}
      aria-label="Primary"
    >
      {LINKS.filter((l) => !("auth" in l && l.auth) || signedIn).map((link) => {
        const active = link.match.some(
          (m) => pathname === m || pathname.startsWith(`${m}/`),
        );
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "transition-colors duration-editorial",
              isStack
                ? cn(
                    "rounded-md px-3 py-2 text-sm",
                    active
                      ? "bg-surface font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                : cn(
                    "rounded-full px-3.5 py-1.5 text-[13px]",
                    active
                      ? "bg-foreground font-medium text-background"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground",
                  ),
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
