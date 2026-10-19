"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  isBookmarkedAction,
  toggleBookmark,
  type BookmarkTargetType,
} from "@/features/data/bookmark-actions";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

export type BookmarkButtonProps = {
  targetType: BookmarkTargetType;
  targetId: string;
  initialBookmarked?: boolean;
  className?: string;
};

export function BookmarkButton({
  targetType,
  targetId,
  initialBookmarked = false,
  className,
}: BookmarkButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(Boolean(initialBookmarked));

  useEffect(() => {
    if (!user?.id || initialBookmarked) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const saved = await isBookmarkedAction(targetType, targetId);
      if (!cancelled) {
        setBookmarked(saved);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, targetType, targetId, initialBookmarked]);

  const handleToggle = () => {
    if (!user?.id) {
      toast.message("Sign in to save to your reading list.");
      router.push("/auth/signin");
      return;
    }

    startTransition(async () => {
      const result = await toggleBookmark({ targetType, targetId });
      if (!result.success) {
        toast.error(result.error || "Could not update bookmark.");
        return;
      }
      setBookmarked(Boolean(result.bookmarked));
      toast.success(
        result.bookmarked ? "Saved to reading list" : "Removed from reading list",
      );
    });
  };

  const label = bookmarked ? "Remove bookmark" : "Save to reading list";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending || (!hydrated && Boolean(user))}
      onClick={handleToggle}
      aria-pressed={bookmarked}
      aria-label={label}
      className={cn(
        "text-muted-foreground transition-colors duration-editorial hover:text-brand",
        bookmarked && "text-brand",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : bookmarked ? (
        <BookmarkCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
      ) : (
        <Bookmark className="mr-1.5 h-3.5 w-3.5" aria-hidden />
      )}
      {bookmarked ? "Saved" : "Save"}
    </Button>
  );
}
