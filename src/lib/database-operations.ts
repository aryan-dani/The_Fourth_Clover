// Database operations helper
// Use these functions in your components for common database operations

import { supabase } from "./supabase";
import type {
  Profile,
  Post,
  PostFilters,
  QueryResult,
  QueryResultArray,
  QueryResultSingle,
  PostWithAuthor,
} from "./database-types";

export class DatabaseOperations {
  // Profile operations
  static async getProfile(id: string): Promise<QueryResult<Profile>> {
    return await supabase.from("profiles").select("*").eq("id", id).single();
  }

  static async getProfileByUsername(
    username: string
  ): Promise<QueryResult<Profile>> {
    return await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();
  }
  static async getAllProfiles(limit = 50): Promise<any> {
    return await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio")
      .limit(limit)
      .order("created_at", { ascending: false });
  }

  static async updateProfile(
    id: string,
    updates: Partial<Profile>
  ): Promise<QueryResult<Profile>> {
    return await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  }

  // Post operations
  static async getPosts(
    filters: PostFilters = {}
  ): Promise<QueryResultArray<Post>> {
    let query = supabase.from("posts").select("*");

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.author_id) {
      query = query.eq("author_id", filters.author_id);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains("tags", filters.tags);
    }

    // Ordering
    const orderBy = filters.order_by || "created_at";
    const ascending = filters.ascending || false;
    query = query.order(orderBy, { ascending });

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      );
    }

    return await query;
  }

  static async getPublishedPosts(limit = 20): Promise<QueryResultArray<Post>> {
    return await supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
  }

  static async getPost(id: string): Promise<QueryResultSingle<Post>> {
    return await supabase.from("posts").select("*").eq("id", id).single();
  }

  static async getPostBySlug(slug: string): Promise<QueryResultSingle<Post>> {
    return await supabase.from("posts").select("*").eq("slug", slug).single();
  }

  static async getUserPosts(
    authorId: string,
    status?: "draft" | "published"
  ): Promise<
    QueryResultArray<
      Post & { likes: { count: number }[]; comments: { count: number }[] }
    >
  > {
    let query = supabase
      .from("posts")
      .select("*, likes(count), comments(count)")
      .eq("author_id", authorId);

    if (status) {
      query = query.eq("status", status);
    }

    return await query.order("created_at", { ascending: false });
  }

  static async createPost(
    post: Omit<Post, "id" | "created_at" | "updated_at">
  ): Promise<QueryResultSingle<Post>> {
    return await supabase
      .from("posts")
      .insert(post) // Changed from [post] to post
      .select()
      .single();
  }

  static async updatePost(
    id: string,
    updates: Partial<Post>
  ): Promise<QueryResultSingle<Post>> {
    return await supabase
      .from("posts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  }

  static async deletePost(id: string): Promise<QueryResult<any>> {
    return await supabase.from("posts").delete().eq("id", id);
  }

  static async searchPosts(
    searchTerm: string
  ): Promise<QueryResultArray<Post>> {
    return await supabase
      .from("posts")
      .select("*")
      .or(`title.ilike.%${searchTerm}%, content.ilike.%${searchTerm}%`)
      .eq("status", "published")
      .order("published_at", { ascending: false });
  }

  // Analytics and counts
  static async getPostCount(status?: "draft" | "published"): Promise<number> {
    let query = supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { count } = await query;
    return count || 0;
  }

  static async getProfileCount(): Promise<number> {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    return count || 0;
  }

  // Posts with author information (join)
  static async getPostsWithAuthor(
    limit = 20
  ): Promise<QueryResultArray<PostWithAuthor>> {
    return await supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles!posts_author_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        likes(count),
        comments(count)
      `
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
  }

  static async getPostWithAuthorBySlug(
    slug: string
  ): Promise<QueryResultSingle<PostWithAuthor>> {
    return await supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles!posts_author_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        likes(count),
        comments(count)
      `
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();
  }

  // Get posts by tag
  static async getPostsByTag(tag: string): Promise<QueryResultArray<Post>> {
    return await supabase
      .from("posts")
      .select("*")
      .contains("tags", [tag])
      .eq("status", "published")
      .order("published_at", { ascending: false });
  }

  // Get all unique tags
  static async getAllTags(): Promise<string[]> {
    const { data } = await supabase
      .from("posts")
      .select("tags")
      .eq("status", "published")
      .not("tags", "is", null);

    if (!data) return [];

    const allTags = data
      .flatMap((post) => post.tags || [])
      .filter((tag, index, array) => array.indexOf(tag) === index)
      .sort();

    return allTags;
  }
}

// Export convenience functions
export const {
  getProfile,
  getProfileByUsername,
  getAllProfiles,
  updateProfile,
  getPosts,
  getPublishedPosts,
  getPost,
  getPostBySlug,
  getUserPosts,
  createPost,
  updatePost,
  deletePost,
  searchPosts,
  getPostCount,
  getProfileCount,
  getPostsWithAuthor,
  getPostWithAuthorBySlug,
  getPostsByTag,
  getAllTags,
} = DatabaseOperations;
