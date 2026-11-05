import type { ReactNode } from "react";

/** Route body wrapper. Kept out of the GSAP module so the layout chunk stays light. */
export function PageEnter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-page-enter
      className={className ? `page-enter ${className}` : "page-enter"}
    >
      {children}
    </div>
  );
}
