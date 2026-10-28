"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Intro } from "@/components/motion/Intro";
import { PageEnter } from "@/components/motion/Reveal";

const TOOL_PREFIXES = [
  "/write",
  "/dashboard",
  "/admin",
  "/settings",
  "/notifications",
  "/verify-csi",
  "/tech-weekly/write",
  "/tech-weekly/review",
  "/csi/write",
  "/csi/review",
];

function isToolPath(pathname: string) {
  return TOOL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function SiteMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isHome = pathname === "/";
  const tools = isToolPath(pathname);

  return (
    <>
      {isHome && <Intro />}
      {tools ? <PageEnter>{children}</PageEnter> : children}
    </>
  );
}
