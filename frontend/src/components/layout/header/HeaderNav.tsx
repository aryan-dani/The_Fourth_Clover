"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    href: "/",
    label: "Home",
    matchExact: true,
    match: ["/"],
  },
  {
    href: "/journal",
    label: "Journal",
    match: ["/journal", "/explore", "/post", "/tags", "/search"],
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
        isStack ? "flex flex-col items-stretch gap-0.5" : "items-center gap-0.5",
        className,
      )}
      aria-label="Primary"
    >
      {LINKS.filter((l) => !("auth" in l && l.auth) || signedIn).map((link) => {
        const active =
          "matchExact" in link && link.matchExact
            ? pathname === "/"
            : link.match.some(
                (m) =>
                  m !== "/" &&
                  (pathname === m || pathname.startsWith(`${m}/`)),
              );

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "transition-colors duration-editorial",
              isStack
                ? cn(
                    "rounded-lg px-3 py-2.5 text-sm",
                    active
                      ? "bg-surface font-medium text-foreground"
                      : "text-muted-foreground hover:bg-surface/70 hover:text-foreground",
                  )
                : cn(
                    "relative rounded-full px-3.5 py-1.5 text-[13px] tracking-tight",
                    active
                      ? "bg-surface font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
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
