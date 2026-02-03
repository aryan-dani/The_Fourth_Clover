"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    NotificationWithSender,
} from "@/lib/notifications";
import { formatRelativeTime } from "@/lib/utils";
import { Bell, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState<NotificationWithSender[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const [notifResult, count] = await Promise.all([
                getNotifications(user.id, 50),
                getUnreadCount(user.id),
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
    }, [user]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push("/auth/signin");
            return;
        }
        fetchNotifications();
    }, [user, authLoading, fetchNotifications, router]);

    const handleMarkAsRead = async (notificationId: string) => {
        await markAsRead(notificationId);
        setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
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
                return "❤️";
            case "comment":
                return "💬";
            case "reply":
                return "↩️";
            case "follow":
                return "👤";
            default:
                return "🔔";
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8 pt-24">
                    <div className="max-w-2xl mx-auto">
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-muted rounded w-1/3"></div>
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="space-y-3 mt-8">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-20 bg-muted rounded-xl"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 pt-24">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2 brand-text">Notifications</h1>
                                <p className="text-muted-foreground">
                                    {unreadCount > 0
                                        ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                                        : "You're all caught up!"}
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Mark all as read
                                </Button>
                            )}
                        </div>
                    </motion.div>

                    {/* Notifications List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {notifications.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                                    <p className="text-muted-foreground mb-4">
                                        When someone interacts with your posts, you'll see it here.
                                    </p>
                                    <Button asChild variant="outline">
                                        <Link href="/explore">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Explore posts
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map((notification, index) => (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <Link
                                            href={notification.post_id ? `/post/${notification.post_id}` : "#"}
                                            onClick={() => {
                                                if (!notification.read) {
                                                    handleMarkAsRead(notification.id);
                                                }
                                            }}
                                        >
                                            <Card
                                                className={`transition-all hover:shadow-md cursor-pointer ${!notification.read
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
                                                                        src={notification.from_user.avatar_url || ""}
                                                                    />
                                                                    <AvatarFallback className="text-sm">
                                                                        {notification.from_user.full_name?.[0] || "U"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xl">
                                                                    {getNotificationIcon(notification.type)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm leading-relaxed">
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
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
