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
  variant = "bar",
}: {
  signedIn: boolean;
  className?: string;
  variant?: "bar" | "stack" | "dock";
}) {
  const pathname = usePathname() || "/";
  const isStack = variant === "stack";

  return (
    <nav
      className={cn(
        isStack
          ? "flex flex-col items-stretch gap-0.5"
          : "inline-flex items-center gap-1",
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
            data-active={active ? "true" : "false"}
            className={cn(
              isStack
                ? cn(
                    "rounded-sm px-3 py-2.5 text-sm transition-colors duration-expo",
                    active
                      ? "bg-surface font-medium text-foreground"
                      : "text-muted-foreground hover:bg-surface/70 hover:text-foreground",
                  )
                : "nav-link",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
