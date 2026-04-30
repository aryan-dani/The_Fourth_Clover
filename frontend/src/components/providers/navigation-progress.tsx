"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const prevKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${pathname}?${searchParams.toString()}`;
    if (prevKey.current === null) {
      prevKey.current = key;
      return;
    }
    if (prevKey.current === key) return;
    prevKey.current = key;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 480);
    return () => window.clearTimeout(t);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-primary/15"
      aria-hidden
    >
      <div className="h-full w-2/5 origin-left bg-primary shadow-[0_0_8px_hsl(var(--primary))] animate-nav-progress" />
    </div>
  );
}

export function NavigationProgress() {
  return <NavigationProgressInner />;
}
