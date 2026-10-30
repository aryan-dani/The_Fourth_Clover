"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RelativeTime } from "@/components/time/RelativeTime";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type NotificationRow = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  actor?: {
    username: string;
    full_name: string | null;
  } | null;
  post?: { title: string; slug: string } | null;
};

export function NotificationsMenu({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("notifications")
        .select(
          "id, type, read, created_at, actor:profiles!notifications_actor_id_fkey(username, full_name), post:posts!notifications_post_id_fkey(title, slug)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8);

      const rows = (data || []) as unknown as NotificationRow[];
      setItems(rows);
      setUnread(rows.filter((n) => !n.read).length);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) void fetchNotifications();
  }, [open, fetchNotifications]);

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const iconFor = (type: string) => {
    if (type === "like") return <Heart className="h-3.5 w-3.5 text-brand" />;
    if (type === "follow") return <UserPlus className="h-3.5 w-3.5 text-brand" />;
    return <MessageCircle className="h-3.5 w-3.5 text-brand" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="nav-icon relative !h-9 !w-9 border-0 p-0 shadow-none hover:bg-transparent"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-hairline px-3 py-2.5">
          <span className="text-sm font-medium">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Loading…
            </p>
          )}
          {!loading && items.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No notifications yet.
            </p>
          )}
          {!loading &&
            items.map((n) => {
              const actor =
                n.actor?.full_name || n.actor?.username || "Someone";
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-2.5 border-b border-hairline px-3 py-2.5 last:border-0",
                    !n.read && "bg-surface/60",
                  )}
                >
                  <div className="mt-0.5">{iconFor(n.type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-foreground">
                      <span className="font-medium">{actor}</span>{" "}
                      {n.type === "like"
                        ? "liked"
                        : n.type === "follow"
                          ? "followed you"
                          : "commented on"}{" "}
                      {n.post?.title ? (
                        <span className="font-medium">{n.post.title}</span>
                      ) : null}
                    </p>
                    <RelativeTime
                      date={n.created_at}
                      className="font-mono text-[10px] text-muted-foreground"
                    />
                  </div>
                </div>
              );
            })}
        </div>
        <div className="border-t border-hairline px-3 py-2">
          <Link
            href="/notifications"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
