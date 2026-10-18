"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  Heart,
  MessageCircle,
  Reply,
  User,
  CheckCircle2,
  AlertCircle,
  FileCheck,
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
  getNotificationHref,
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
      case "review_submitted":
        return (
          <FileCheck className={className} strokeWidth={1.75} aria-hidden />
        );
      case "review_approved":
        return (
          <CheckCircle2 className={className} strokeWidth={1.75} aria-hidden />
        );
      case "changes_requested":
        return (
          <AlertCircle className={className} strokeWidth={1.75} aria-hidden />
        );
      default:
        return <Bell className={className} strokeWidth={1.75} aria-hidden />;
    }
  };

  if (!user) return null;

  return (
    <LazyMotion features={domAnimation}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="text-muted-foreground hover:text-foreground relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <m.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </m.span>
              )}
            </AnimatePresence>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "border-border/50 bg-popover/98 w-80 overflow-hidden rounded-2xl border p-0 shadow-2xl backdrop-blur-xl",
            "origin-top-right duration-200 ease-out",
            "data-[state=open]:zoom-in-98 data-[state=closed]:zoom-out-98",
            "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
          )}
          align="end"
          sideOffset={12}
        >
          <div className="border-border/50 from-accent/30 flex items-center justify-between border-b bg-gradient-to-b to-transparent px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                <Check className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          <ScrollArea className="h-80 [&_[data-radix-scroll-area-viewport]]:overscroll-y-contain">
            {loading && notifications.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-muted-foreground flex h-32 flex-col items-center justify-center">
                <Bell className="mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  const href = getNotificationHref(notification);
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
                          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm">
                          {notification.message}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
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
                      className={`hover:bg-muted/50 cursor-pointer p-3 transition-colors duration-150 ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                      onClick={handleClick}
                    >
                      <Link href={href}>{NotificationContent}</Link>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </LazyMotion>
  );
}
