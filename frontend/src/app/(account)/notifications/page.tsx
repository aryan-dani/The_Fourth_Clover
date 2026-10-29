"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/features/auth/auth-context";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotificationHref,
  stripTechSubmissionMarker,
  NotificationWithSender,
} from "@/features/notifications/notifications";
import { RelativeTime } from "@/components/time/RelativeTime";
import {
  Bell,
  Check,
  ArrowLeft,
  Heart,
  MessageCircle,
  Reply,
  User,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<NotificationWithSender[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [notifResult, count] = await Promise.all([
        getNotifications(userId, 50),
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
    if (authLoading) return;
    if (!userId) {
      router.push("/auth/signin");
      return;
    }
    void fetchNotifications();
  }, [userId, authLoading, fetchNotifications, router]);

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return { Icon: Heart, label: "Like notification" };
      case "comment":
        return { Icon: MessageCircle, label: "Comment notification" };
      case "reply":
        return { Icon: Reply, label: "Reply notification" };
      case "follow":
        return { Icon: User, label: "Follow notification" };
      case "review_submitted":
        return { Icon: FileCheck, label: "CSI review submission" };
      case "review_approved":
        return { Icon: CheckCircle2, label: "CSI review approved" };
      case "changes_requested":
        return { Icon: AlertCircle, label: "CSI changes requested" };
      default:
        return { Icon: Bell, label: "Notification" };
    }
  };

  if (loading || authLoading) {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <main className="flex-1 pt-20 pb-8">
          <PageShell variant="default">
            <div className="mx-auto max-w-2xl animate-pulse space-y-4">
              <div className="bg-muted h-8 w-1/3 rounded"></div>
              <div className="bg-muted h-4 w-1/4 rounded"></div>
              <div className="mt-8 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-muted h-20 rounded-xl"></div>
                ))}
              </div>
            </div>
          </PageShell>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
        <main className="flex-1 pt-20 pb-8">
          <PageShell
            variant="default"
            title="Notifications"
            description={
              unreadCount > 0
                ? `You have ${unreadCount} unread notification${
                    unreadCount > 1 ? "s" : ""
                  }.`
                : "You're all caught up."
            }
            headerActions={
              unreadCount > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Mark all as read
                </Button>
              ) : null
            }
          >
            {/* Notifications List */}
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bell className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-50" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No notifications yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      When someone interacts with your posts, you&apos;ll see it
                      here.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/journal">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Explore posts
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => {
                    const href = getNotificationHref(notification);
                    return (
                      <div key={notification.id} className="relative">
                        <Link
                          href={href}
                          className="absolute inset-0 z-10 rounded-[inherit]"
                          aria-label={stripTechSubmissionMarker(
                            notification.message,
                          )}
                          onClick={() => {
                            if (!notification.read) {
                              handleMarkAsRead(notification.id);
                            }
                          }}
                        />
                        <Card
                          className={`transition-all hover:shadow-md ${
                            !notification.read
                              ? "bg-primary/5 border-primary/20"
                              : "hover:bg-muted/50"
                          }`}
                        >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  {notification.from_user ? (
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage
                                        src={
                                          notification.from_user.avatar_url ||
                                          undefined
                                        }
                                      />
                                      <AvatarFallback className="text-sm">
                                        {notification.from_user.full_name?.[0] ||
                                          "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    (() => {
                                      const { Icon, label } =
                                        getNotificationIcon(notification.type);
                                      return (
                                        <div
                                          className="bg-muted text-primary flex h-10 w-10 items-center justify-center rounded-full"
                                          role="img"
                                          aria-label={label}
                                        >
                                          <Icon
                                            className="h-5 w-5"
                                            aria-hidden
                                          />
                                        </div>
                                      );
                                    })()
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm leading-relaxed">
                                    {stripTechSubmissionMarker(
                                      notification.message,
                                    )}
                                  </p>
                                  <RelativeTime
                                    date={notification.created_at}
                                    className="text-muted-foreground mt-1 block text-xs"
                                  />
                                </div>
                                {!notification.read && (
                                  <div className="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                      </div>
                    );
                  })}
                </div>
              )}
          </PageShell>
        </main>
      </div>
  );
}
