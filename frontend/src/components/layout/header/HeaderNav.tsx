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
        isStack ? "flex flex-col items-stretch gap-0.5" : "items-center gap-8",
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
              "transition-colors duration-expo",
              isStack
                ? cn(
                    "rounded-sm px-3 py-2.5 text-sm",
                    active
                      ? "bg-surface font-medium text-foreground"
                      : "text-muted-foreground hover:bg-surface/70 hover:text-foreground",
                  )
                : cn(
                    "rounded-[var(--radius)] px-3 py-1.5 text-[13px] tracking-tight transition-colors duration-expo",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-[var(--fg-faint)] hover:text-foreground",
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
