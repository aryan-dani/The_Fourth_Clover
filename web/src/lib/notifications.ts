/**
 * Notification operations for The Fourth Clover
 * Handles creating, fetching, and managing user notifications
 */

import { supabase } from "./supabase";
import type { Notification, Profile, QueryResultArray } from "./database-types";

export type NotificationType = "like" | "comment" | "reply" | "follow";

export interface NotificationWithSender extends Notification {
    from_user: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export class NotificationOperations {
    /**
     * Get notifications for the current user
     */
    static async getNotifications(
        userId: string,
        limit = 20,
        unreadOnly = false
    ): Promise<QueryResultArray<NotificationWithSender>> {
        let query = supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq("read", false);
        }

        const { data, error } = await query;

        if (error || !data) {
            return { data: null, error };
        }

        // Fetch sender profiles separately
        const fromUserIds = Array.from(new Set(data.filter(n => n.from_user_id).map(n => n.from_user_id)));
        let profilesMap: Record<string, any> = {};

        if (fromUserIds.length > 0) {
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, username, full_name, avatar_url")
                .in("id", fromUserIds);

            if (profiles) {
                profilesMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            }
        }

        // Combine notifications with sender info
        const notificationsWithSender = data.map(notification => ({
            ...notification,
            from_user: notification.from_user_id ? profilesMap[notification.from_user_id] || null : null
        }));

        return { data: notificationsWithSender, error: null };
    }

    /**
     * Get unread notification count
     */
    static async getUnreadCount(userId: string): Promise<number> {
        const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("read", false);

        return count || 0;
    }

    /**
     * Mark a notification as read
     */
    static async markAsRead(notificationId: string): Promise<void> {
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId);
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId: string): Promise<void> {
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", userId)
            .eq("read", false);
    }

    /**
     * Create a notification
     */
    static async createNotification(
        userId: string,
        type: NotificationType,
        message: string,
        fromUserId?: string,
        postId?: string
    ): Promise<void> {
        // Don't notify yourself
        if (fromUserId === userId) return;

        await supabase.from("notifications").insert({
            user_id: userId,
            type,
            message,
            from_user_id: fromUserId || null,
            post_id: postId || null,
            read: false,
        });
    }

    /**
     * Delete a notification
     */
    static async deleteNotification(notificationId: string): Promise<void> {
        await supabase.from("notifications").delete().eq("id", notificationId);
    }

    /**
     * Helper: Create a like notification
     */
    static async notifyLike(
        postAuthorId: string,
        likerId: string,
        likerName: string,
        postTitle: string,
        postId: string
    ): Promise<void> {
        await this.createNotification(
            postAuthorId,
            "like",
            `${likerName} liked your post "${postTitle}"`,
            likerId,
            postId
        );
    }

    /**
     * Helper: Create a comment notification
     */
    static async notifyComment(
        postAuthorId: string,
        commenterId: string,
        commenterName: string,
        postTitle: string,
        postId: string
    ): Promise<void> {
        await this.createNotification(
            postAuthorId,
            "comment",
            `${commenterName} commented on your post "${postTitle}"`,
            commenterId,
            postId
        );
    }

    /**
     * Helper: Create a reply notification
     */
    static async notifyReply(
        parentCommentAuthorId: string,
        replierId: string,
        replierName: string,
        postTitle: string,
        postId: string
    ): Promise<void> {
        await this.createNotification(
            parentCommentAuthorId,
            "reply",
            `${replierName} replied to your comment on "${postTitle}"`,
            replierId,
            postId
        );
    }
}

// Export convenience functions
export const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    notifyLike,
    notifyComment,
    notifyReply,
} = NotificationOperations;
