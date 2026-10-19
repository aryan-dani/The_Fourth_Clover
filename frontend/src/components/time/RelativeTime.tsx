"use client";

import { useEffect, useState } from "react";
import { formatDate, formatRelativeTime } from "@/lib/utils";

/**
 * Hydration-safe relative timestamp. SSR + first client paint use a stable
 * absolute date; after mount we switch to relative labels so React #418
 * (server/client text mismatch from Date.now()) cannot fire.
 */
export function RelativeTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const [label, setLabel] = useState(() => formatDate(date));

  useEffect(() => {
    const update = () => setLabel(formatRelativeTime(date));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [date]);

  return (
    <time dateTime={date} className={className} suppressHydrationWarning>
      {label}
    </time>
  );
}
