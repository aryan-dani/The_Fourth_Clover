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
          status: "draft" | "published";
          author_id: string;
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
          status?: "draft" | "published";
          author_id: string;
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
          status?: "draft" | "published";
          author_id?: string;
          tags?: string[] | null;
          read_time?: number;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          scheduled_at?: string | null;
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
          type: "like" | "comment" | "reply" | "follow";
          message: string;
          post_id: string | null;
          from_user_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "like" | "comment" | "reply" | "follow";
          message: string;
          post_id?: string | null;
          from_user_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "like" | "comment" | "reply" | "follow";
          message?: string;
          post_id?: string | null;
          from_user_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
      };
    };
  };
};
