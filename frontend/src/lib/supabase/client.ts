import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// For build-time compatibility, provide fallback values
const defaultUrl = "https://placeholder.supabase.co";
const defaultKey = "placeholder-key";

// Use fallbacks during build if environment variables are missing
const url = supabaseUrl || defaultUrl;
const key = supabaseAnonKey || defaultKey;

/**
 * Browser Supabase client must use cookie storage (via @supabase/ssr) so sessions
 * are visible to createSupabaseServerClient() in Server Components (e.g. /explore/following).
 * A plain supabase-js client with localStorage-only breaks SSR auth checks.
 */
let supabaseInstance: SupabaseClient | null = null;
let serverSideFallback: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    if (!supabaseInstance) {
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error(
          "Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables."
        );
      }
      supabaseInstance = createBrowserClient(url, key);
    }
    return supabaseInstance;
  }

  if (!serverSideFallback) {
    serverSideFallback = createBrowserClient(url, key);
  }
  return serverSideFallback;
}

export const supabase = getSupabaseClient();

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          website: string | null;
          twitter: string | null;
          github: string | null;
          is_admin: boolean;
          csi_id: number | null;
          role: "unverified" | "member" | "tech_member" | "tech_head" | "super_admin";
          dept: string | null;
          year: string | null;
          is_suspended: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          twitter?: string | null;
          github?: string | null;
          is_admin?: boolean;
          csi_id?: number | null;
          role?: "unverified" | "member" | "tech_member" | "tech_head" | "super_admin";
          dept?: string | null;
          year?: string | null;
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          twitter?: string | null;
          github?: string | null;
          is_admin?: boolean;
          csi_id?: number | null;
          role?: "unverified" | "member" | "tech_member" | "tech_head" | "super_admin";
          dept?: string | null;
          year?: string | null;
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string | null;
          excerpt: string | null;
          featured_image: string | null;
          cover_image: string | null;
          status: "draft" | "in_review" | "published";
          author_id: string;
          publication_id: string | null;
          review_note: string | null;
          linkedin_pick_week?: string | null;
          linkedin_picked_by?: string | null;
          tags: string[] | null;
          read_time: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          scheduled_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content?: string | null;
          excerpt?: string | null;
          featured_image?: string | null;
          cover_image?: string | null;
          status?: "draft" | "in_review" | "published";
          author_id: string;
          publication_id?: string | null;
          review_note?: string | null;
          linkedin_pick_week?: string | null;
          linkedin_picked_by?: string | null;
          tags?: string[] | null;
          read_time?: number;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          scheduled_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string | null;
          excerpt?: string | null;
          featured_image?: string | null;
          cover_image?: string | null;
          status?: "draft" | "in_review" | "published";
          author_id?: string;
          publication_id?: string | null;
          review_note?: string | null;
          linkedin_pick_week?: string | null;
          linkedin_picked_by?: string | null;
          tags?: string[] | null;
          read_time?: number;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          scheduled_at?: string | null;
        };
      };
      publications: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          cover_image: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          cover_image?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          cover_image?: string | null;
          created_at?: string;
        };
      };
      publication_members: {
        Row: {
          publication_id: string;
          user_id: string;
          role: "writer" | "editor";
          created_at: string;
        };
        Insert: {
          publication_id: string;
          user_id: string;
          role: "writer" | "editor";
          created_at?: string;
        };
        Update: {
          publication_id?: string;
          user_id?: string;
          role?: "writer" | "editor";
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      post_categories: {
        Row: {
          post_id: string;
          category_id: string;
        };
        Insert: {
          post_id: string;
          category_id: string;
        };
        Update: {
          post_id?: string;
          category_id?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          content: string;
          author_id: string;
          post_id: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          author_id: string;
          post_id: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          author_id?: string;
          post_id?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "like"
            | "comment"
            | "reply"
            | "follow"
            | "review_submitted"
            | "review_approved"
            | "changes_requested";
          message: string;
          post_id: string | null;
          from_user_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "like"
            | "comment"
            | "reply"
            | "follow"
            | "review_submitted"
            | "review_approved"
            | "changes_requested";
          message: string;
          post_id?: string | null;
          from_user_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "like"
            | "comment"
            | "reply"
            | "follow"
            | "review_submitted"
            | "review_approved"
            | "changes_requested";
          message?: string;
          post_id?: string | null;
          from_user_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
      };
      csi_roster: {
        Row: {
          csi_id: number;
          name: string;
          dept: string;
          year: string | null;
          prn_missing: boolean;
          prn_duplicate: boolean;
          role: "member" | "tech_member" | "tech_head" | "super_admin";
          claimed_by: string | null;
          claimed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          csi_id: number;
          name: string;
          dept: string;
          year?: string | null;
          prn_hash?: string | null;
          prn_missing?: boolean;
          prn_duplicate?: boolean;
          role: "member" | "tech_member" | "tech_head" | "super_admin";
          claimed_by?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          csi_id?: number;
          name?: string;
          dept?: string;
          year?: string | null;
          prn_hash?: string | null;
          prn_missing?: boolean;
          prn_duplicate?: boolean;
          role?: "member" | "tech_member" | "tech_head" | "super_admin";
          claimed_by?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      platform_settings: {
        Row: {
          id: number;
          cutoff_day: number;
          cutoff_hour_ist: number;
          cutoff_minute_ist: number;
          posts_per_week: number;
          allow_member_comments: boolean;
          submissions_override: "auto" | "force_open" | "force_closed";
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          cutoff_day?: number;
          cutoff_hour_ist?: number;
          cutoff_minute_ist?: number;
          posts_per_week?: number;
          allow_member_comments?: boolean;
          submissions_override?: "auto" | "force_open" | "force_closed";
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: number;
          cutoff_day?: number;
          cutoff_hour_ist?: number;
          cutoff_minute_ist?: number;
          posts_per_week?: number;
          allow_member_comments?: boolean;
          submissions_override?: "auto" | "force_open" | "force_closed";
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      tech_weeks: {
        Row: {
          id: string;
          week_key: string;
          week_number: number | null;
          title: string;
          prompt: string | null;
          starts_at: string;
          cutoff_at: string;
          ends_at: string;
          is_locked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_key: string;
          week_number?: number | null;
          title: string;
          prompt?: string | null;
          starts_at: string;
          cutoff_at: string;
          ends_at: string;
          is_locked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          week_key?: string;
          week_number?: number | null;
          title?: string;
          prompt?: string | null;
          starts_at?: string;
          cutoff_at?: string;
          ends_at?: string;
          is_locked?: boolean;
          created_at?: string;
        };
      };
      tech_submissions: {
        Row: {
          id: string;
          week_id: string;
          author_id: string;
          title: string;
          slug: string;
          summary: string | null;
          content: string;
          cover_image: string | null;
          tags: string[];
          word_count: number;
          read_time: number;
          status: "draft" | "submitted" | "approved" | "rejected" | "selected" | "archived";
          review_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          selected_by: string | null;
          selected_at: string | null;
          is_deleted: boolean;
          deleted_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          week_id: string;
          author_id: string;
          title: string;
          slug: string;
          summary?: string | null;
          content: string;
          cover_image?: string | null;
          tags?: string[];
          word_count?: number;
          read_time?: number;
          status?: "draft" | "submitted" | "approved" | "rejected" | "selected" | "archived";
          review_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          selected_by?: string | null;
          selected_at?: string | null;
          is_deleted?: boolean;
          deleted_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          submitted_at?: string | null;
        };
        Update: {
          id?: string;
          week_id?: string;
          author_id?: string;
          title?: string;
          slug?: string;
          summary?: string | null;
          content?: string;
          cover_image?: string | null;
          tags?: string[];
          word_count?: number;
          read_time?: number;
          status?: "draft" | "submitted" | "approved" | "rejected" | "selected" | "archived";
          review_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          selected_by?: string | null;
          selected_at?: string | null;
          is_deleted?: boolean;
          deleted_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          submitted_at?: string | null;
        };
      };
      tech_comments: {
        Row: {
          id: string;
          submission_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          is_deleted: boolean;
          deleted_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          is_deleted?: boolean;
          deleted_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          user_id?: string;
          parent_id?: string | null;
          content?: string;
          is_deleted?: boolean;
          deleted_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tech_reactions: {
        Row: {
          id: string;
          submission_id: string;
          user_id: string;
          reaction_type: "like" | "insightful" | "fire";
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          user_id: string;
          reaction_type: "like" | "insightful" | "fire";
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          user_id?: string;
          reaction_type?: "like" | "insightful" | "fire";
          created_at?: string;
        };
      };
      tech_reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: "submission" | "comment" | "post";
          target_id: string;
          reason: string;
          status: "open" | "resolved" | "dismissed";
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: "submission" | "comment" | "post";
          target_id: string;
          reason: string;
          status?: "open" | "resolved" | "dismissed";
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: "submission" | "comment" | "post";
          target_id?: string;
          reason?: string;
          status?: "open" | "resolved" | "dismissed";
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_csi_id: number | null;
          action: string;
          target_type: string;
          target_id: string | null;
          before_state: Record<string, unknown> | null;
          after_state: Record<string, unknown> | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_csi_id?: number | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          before_state?: Record<string, unknown> | null;
          after_state?: Record<string, unknown> | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          actor_csi_id?: number | null;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          before_state?: Record<string, unknown> | null;
          after_state?: Record<string, unknown> | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
    };
  };
};
