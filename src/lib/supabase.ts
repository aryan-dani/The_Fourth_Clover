import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// For build-time compatibility, provide fallback values
const defaultUrl = "https://placeholder.supabase.co";
const defaultKey = "placeholder-key";

// Use fallbacks during build if environment variables are missing
const url = supabaseUrl || defaultUrl;
const key = supabaseAnonKey || defaultKey;

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

// Create a function to get the Supabase client
// This ensures it's only created on the client side with proper storage
function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const isClient = typeof window !== "undefined";

  if (isClient && (!supabaseUrl || !supabaseAnonKey)) {
    console.error(
      "Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables."
    );
  }

  supabaseInstance = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: isClient,
      // Disable automatic URL detection - we handle it manually in the callback page
      detectSessionInUrl: false,
      flowType: "pkce",
      storage: isClient ? window.localStorage : undefined,
      // Use default storage key (based on Supabase URL) for consistent PKCE handling
    },
  });

  return supabaseInstance;
}

// Export a getter that always returns the singleton
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
