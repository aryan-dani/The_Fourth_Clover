"use client";

import { cn } from "@/lib/utils";

export type ReactionItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export type ReactionBarProps = {
  items: ReactionItem[];
  className?: string;
};

export function ReactionBar({ items, className }: ReactionBarProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
      role="group"
      aria-label="Reactions"
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          disabled={item.disabled}
          aria-pressed={item.active}
          aria-label={item.label}
          className={cn(
            "inline-flex items-center gap-2 border border-hairline px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-editorial",
            "hover:border-brand/40 hover:text-brand",
            "disabled:pointer-events-none disabled:opacity-50",
            item.active
              ? "border-brand/50 bg-brand/5 text-brand"
              : "bg-background text-muted-foreground",
          )}
        >
          <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden>
            {item.icon}
          </span>
          <span>{item.label}</span>
          <span className="tabular-nums text-foreground/80">{item.count}</span>
        </button>
      ))}
    </div>
  );
}
