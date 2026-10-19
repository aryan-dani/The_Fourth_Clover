import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/time/RelativeTime";
import { cn } from "@/lib/utils";

export type BylineAuthor = {
  username: string;
  fullName?: string | null;
  /** DB / PostgREST shape */
  full_name?: string | null;
  avatarUrl?: string | null;
  /** DB / PostgREST shape */
  avatar_url?: string | null;
  dept?: string | null;
  year?: string | number | null;
  isCsi?: boolean;
};

export type BylineProps = {
  author: BylineAuthor;
  publishedAt?: string | null;
  readTime?: number | null;
  className?: string;
  size?: "sm" | "md";
};

function badgeLabel(author: BylineAuthor): string | null {
  if (author.dept) {
    const year = author.year != null && author.year !== "" ? ` · ${author.year}` : "";
    return `CSI ${author.dept}${year}`;
  }
  if (author.isCsi) return "CSI";
  return null;
}

export function Byline({
  author,
  publishedAt,
  readTime,
  className,
  size = "md",
}: BylineProps) {
  const displayName =
    (author.fullName ?? author.full_name)?.trim() || author.username;
  const avatarSrc = author.avatarUrl ?? author.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();
  const badge = badgeLabel(author);
  const avatarSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Link
        href={`/profile/${author.username}`}
        className="shrink-0 transition-opacity duration-editorial hover:opacity-80"
      >
        <Avatar className={cn(avatarSize, "rounded-full border border-hairline")}>
          <AvatarImage src={avatarSrc || undefined} alt={displayName} />
          <AvatarFallback className="bg-muted font-mono text-[10px] uppercase text-muted-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Link
            href={`/profile/${author.username}`}
            className="truncate text-sm font-medium text-foreground transition-colors duration-editorial hover:text-brand"
          >
            {displayName}
          </Link>
          {badge && (
            <span className="meta-label shrink-0 text-brand/80">{badge}</span>
          )}
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          {publishedAt && <RelativeTime date={publishedAt} />}
          {publishedAt && readTime != null && readTime > 0 && (
            <span aria-hidden>·</span>
          )}
          {readTime != null && readTime > 0 && (
            <span className="tabular-nums">{readTime} min read</span>
          )}
        </div>
      </div>
    </div>
  );
}
