import { cn } from "@/lib/utils";

type PageShellVariant = "default" | "wide" | "reading";

type PageShellProps = {
  title?: string;
  description?: string;
  variant?: PageShellVariant;
  /** Full width above the title row (e.g. back links) */
  headerLead?: React.ReactNode;
  /** Right side of the title row, aligned with the heading block */
  headerActions?: React.ReactNode;
  /** @deprecated Prefer headerLead or headerActions */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
};

const maxWidth: Record<PageShellVariant, string> = {
  default: "max-w-content",
  wide: "max-w-wide",
  reading: "max-w-reading",
};

export function PageShell({
  title,
  description,
  variant = "default",
  headerLead,
  headerActions,
  headerExtra,
  children,
  className,
  noPadding,
}: PageShellProps) {
  const showHeader =
    title || description || headerLead || headerActions || headerExtra;

  return (
    <div
      className={cn(
        !noPadding && "py-8 md:py-12",
        "mx-auto w-full px-5 sm:px-8 lg:px-10",
        maxWidth[variant],
        className,
      )}
    >
      {showHeader && (
        <header className="mb-8 border-b border-[var(--fg-line)] pb-6 md:mb-10 md:pb-8">
          {headerLead && (
            <div className="mb-4 [&_a]:inline-flex">{headerLead}</div>
          )}

          {(title || description || headerActions) && (
            <div
              className={cn(
                "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
                !title && !description && headerActions && "sm:justify-end",
              )}
            >
              {(title || description) && (
                <div className="min-w-0 flex-1">
                  {title && (
                    <h1 className="type-display text-[clamp(2rem,5vw,3.25rem)] text-foreground">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="type-body mt-3 max-w-2xl text-base md:text-lg">
                      {description}
                    </p>
                  )}
                </div>
              )}
              {headerActions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  {headerActions}
                </div>
              )}
            </div>
          )}

          {headerExtra && !headerLead && !headerActions && (
            <div className={cn(title || description ? "mt-4" : "")}>
              {headerExtra}
            </div>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
