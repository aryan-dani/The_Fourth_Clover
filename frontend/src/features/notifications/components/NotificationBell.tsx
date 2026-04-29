"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  Heart,
  MessageCircle,
  Reply,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/auth-context";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  NotificationWithSender,
} from "@/features/notifications/notifications";
import Link from "next/link";
import { cn, formatRelativeTime } from "@/lib/utils";

export function NotificationBell() {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<NotificationWithSender[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [notifResult, count] = await Promise.all([
        getNotifications(userId, 20),
        getUnreadCount(userId),
      ]);

      if (notifResult.data) {
        setNotifications(notifResult.data);
      }
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string): ReactNode => {
    const className = "h-4 w-4 text-muted-foreground shrink-0";
    switch (type) {
      case "like":
        return <Heart className={className} strokeWidth={1.75} aria-hidden />;
      case "comment":
        return (
          <MessageCircle className={className} strokeWidth={1.75} aria-hidden />
        );
      case "reply":
        return <Reply className={className} strokeWidth={1.75} aria-hidden />;
      case "follow":
        return <User className={className} strokeWidth={1.75} aria-hidden />;
      default:
        return <Bell className={className} strokeWidth={1.75} aria-hidden />;
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground transition-all duration-300"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-medium"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-80 p-0 rounded-2xl border border-border/50 shadow-2xl bg-popover/98 backdrop-blur-xl overflow-hidden",
          "origin-top-right duration-200 ease-out",
          "data-[state=open]:zoom-in-98 data-[state=closed]:zoom-out-98",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
        )}
        align="end"
        sideOffset={12}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-b from-accent/30 to-transparent">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80 [&_[data-radix-scroll-area-viewport]]:overscroll-y-contain">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const NotificationContent = (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {notification.from_user ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={notification.from_user.avatar_url || ""}
                          />
                          <AvatarFallback className="text-xs">
                            {notification.from_user.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                    )}
                  </div>
                );

                const handleClick = () => {
                  if (!notification.read) {
                    handleMarkAsRead(notification.id);
                  }
                  setIsOpen(false);
                };

                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted/50 transition-colors duration-150 cursor-pointer ${!notification.read ? "bg-primary/5" : ""}`}
                    onClick={handleClick}
                  >
                    {notification.post_id ? (
                      <Link href={`/post/${notification.post_id}`}>
                        {NotificationContent}
                      </Link>
                    ) : (
                      NotificationContent
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
