import Link from "next/link";
import { cn } from "@/lib/utils";

export type TagChipProps = {
  tag: string;
  className?: string;
};

export function TagChip({ tag, className }: TagChipProps) {
  const slug = encodeURIComponent(tag.trim().toLowerCase());

  return (
    <Link
      href={`/tags/${slug}`}
      className={cn(
        "inline-flex items-center border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors duration-editorial hover:border-brand/40 hover:text-brand",
        className,
      )}
    >
      {tag}
    </Link>
  );
}
