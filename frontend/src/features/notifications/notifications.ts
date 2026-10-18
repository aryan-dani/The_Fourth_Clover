/**
 * Notification operations for The Fourth Clover
 * Handles creating, fetching, and managing user notifications
 */

import { supabase } from "@/lib/supabase/client";
import type {
  Notification,
  Profile,
  QueryResultArray,
} from "@/types/database";

export type NotificationType =
  | "like"
  | "comment"
  | "reply"
  | "follow"
  | "review_submitted"
  | "review_approved"
  | "changes_requested";

export interface NotificationPostMeta {
  id: string;
  slug: string;
  status: string;
  publication_slug: string | null;
}

export interface NotificationWithSender extends Notification {
  from_user: Pick<
    Profile,
    "id" | "username" | "full_name" | "avatar_url"
  > | null;
  post?: NotificationPostMeta | null;
}

export function getNotificationHref(n: NotificationWithSender): string {
  if (n.type === "follow" && n.from_user?.username) {
    return `/profile/${encodeURIComponent(n.from_user.username)}`;
  }
  if (n.type === "review_submitted") {
    return "/csi/review";
  }
  if (n.type === "changes_requested") {
    return n.post_id ? `/csi/write?edit=${encodeURIComponent(n.post_id)}` : "/dashboard";
  }
  if (n.post?.slug) {
    if (n.post.publication_slug) {
      return `/${encodeURIComponent(n.post.publication_slug)}/${encodeURIComponent(n.post.slug)}`;
    }
    return `/post/${encodeURIComponent(n.post.slug)}`;
  }
  if (n.type === "review_approved") {
    return "/csi";
  }
  return "/notifications";
}

export class NotificationOperations {
  /**
   * Get notifications for the current user
   */
  static async getNotifications(
    userId: string,
    limit = 20,
    unreadOnly = false,
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

    const fromUserIds = Array.from(
      new Set(
        data
          .map((n: Notification) => n.from_user_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const postIds = Array.from(
      new Set(
        data
          .map((n: Notification) => n.post_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    let profilesMap: Record<
      string,
      Pick<Profile, "id" | "username" | "full_name" | "avatar_url">
    > = {};
    let postsMap: Record<string, NotificationPostMeta> = {};

    if (fromUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", fromUserIds);

      if (profiles) {
        profilesMap = (
          profiles as Pick<
            Profile,
            "id" | "username" | "full_name" | "avatar_url"
          >[]
        ).reduce<
          Record<
            string,
            Pick<Profile, "id" | "username" | "full_name" | "avatar_url">
          >
        >((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }
    }

    if (postIds.length > 0) {
      const { data: postsRows, error: postsErr } = await supabase
        .from("posts")
        .select("id, slug, status, publication:publications(slug)")
        .in("id", postIds);

      if (!postsErr && postsRows) {
        for (const row of postsRows as unknown as {
          id: string;
          slug: string;
          status: string;
          publication?: { slug: string } | { slug: string }[] | null;
        }[]) {
          const pub = Array.isArray(row.publication)
            ? row.publication[0]
            : row.publication;
          postsMap[row.id] = {
            id: row.id,
            slug: row.slug,
            status: row.status,
            publication_slug: pub?.slug ?? null,
          };
        }
      } else {
        const { data: fallbackRows } = await supabase
          .from("posts")
          .select("id, slug, status")
          .in("id", postIds);
        if (fallbackRows) {
          for (const row of fallbackRows as {
            id: string;
            slug: string;
            status: string;
          }[]) {
            postsMap[row.id] = {
              id: row.id,
              slug: row.slug,
              status: row.status,
              publication_slug: null,
            };
          }
        }
      }
    }

    const notificationsWithSender: NotificationWithSender[] = (
      data as Notification[]
    ).map((notification) => ({
      ...notification,
      from_user: notification.from_user_id
        ? profilesMap[notification.from_user_id] || null
        : null,
      post: notification.post_id
        ? postsMap[notification.post_id] || null
        : null,
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
    postId?: string,
  ): Promise<void> {
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
    postId: string,
  ): Promise<void> {
    await NotificationOperations.createNotification(
      postAuthorId,
      "like",
      `${likerName} liked your post "${postTitle}"`,
      likerId,
      postId,
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
    postId: string,
  ): Promise<void> {
    await NotificationOperations.createNotification(
      postAuthorId,
      "comment",
      `${commenterName} commented on your post "${postTitle}"`,
      commenterId,
      postId,
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
    postId: string,
  ): Promise<void> {
    await NotificationOperations.createNotification(
      parentCommentAuthorId,
      "reply",
      `${replierName} replied to your comment on "${postTitle}"`,
      replierId,
      postId,
    );
  }

  /**
   * Helper: notify a user that someone followed them
   */
  static async notifyFollow(
    followedUserId: string,
    followerId: string,
    followerDisplayName: string,
  ): Promise<void> {
    await NotificationOperations.createNotification(
      followedUserId,
      "follow",
      `${followerDisplayName} started following you`,
      followerId,
    );
  }
}

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
  notifyFollow,
} = NotificationOperations;
