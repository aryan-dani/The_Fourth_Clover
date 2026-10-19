"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/journal", label: "Journal", match: ["/journal", "/explore", "/post"] },
  { href: "/tech-weekly", label: "Tech Weekly", match: ["/tech-weekly"] },
  { href: "/following", label: "Following", match: ["/following", "/explore/following"], auth: true },
] as const;

export function HeaderNav({
  signedIn,
  className,
}: {
  signedIn: boolean;
  className?: string;
}) {
  const pathname = usePathname() || "/";

  return (
    <nav className={cn("items-center gap-1", className)} aria-label="Primary">
      {LINKS.filter((l) => !("auth" in l && l.auth) || signedIn).map((link) => {
        const active = link.match.some(
          (m) => pathname === m || pathname.startsWith(`${m}/`),
        );
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors duration-editorial",
              active
                ? "bg-surface font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
