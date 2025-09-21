// Complete Database Operations for All 6 Tables
// Updated to match actual database schema

import { supabase } from "./supabase";
import type {
  Profile,
  Post,
  Category,
  PostCategory,
  Comment,
  Like,
  PostWithAuthor,
  PostWithCategories,
  CommentWithAuthor,
  CommentWithReplies,
} from "./database-types";

export class DatabaseOperations {
  // ========================================
  // PROFILE OPERATIONS
  // ========================================

  static async getProfile(id: string) {
    return await supabase.from("profiles").select("*").eq("id", id).single();
  }

  static async getProfileByUsername(username: string) {
    return await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();
  }

  static async getAllProfiles(limit = 50) {
    return await supabase
      .from("profiles")
      .select("*")
      .limit(limit)
      .order("created_at", { ascending: false });
  }

  static async updateProfile(id: string, updates: Partial<Profile>) {
    return await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  }

  // ========================================
  // CATEGORY OPERATIONS
  // ========================================

  static async getAllCategories() {
    return await supabase.from("categories").select("*").order("name");
  }

  static async getCategory(id: string) {
    return await supabase.from("categories").select("*").eq("id", id).single();
  }

  static async getCategoryBySlug(slug: string) {
    return await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();
  }

  static async createCategory(category: Omit<Category, "id" | "created_at">) {
    return await supabase
      .from("categories")
      .insert([category])
      .select()
      .single();
  }

  static async updateCategory(id: string, updates: Partial<Category>) {
    return await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  }

  static async deleteCategory(id: string) {
    return await supabase.from("categories").delete().eq("id", id);
  }

  // ========================================
  // POST OPERATIONS
  // ========================================

  static async getPosts(
    filters: {
      status?: "draft" | "published";
      author_id?: string;
      category_id?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    let query = supabase.from("posts").select("*");

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.author_id) {
      query = query.eq("author_id", filters.author_id);
    }

    if (filters.category_id) {
      // Join with post_categories to filter by category
      query = supabase
        .from("posts")
        .select(
          `
          *,
          post_categories!inner(category_id)
        `
        )
        .eq("post_categories.category_id", filters.category_id);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      );
    }

    return await query.order("created_at", { ascending: false });
  }

  static async getPostsWithAuthor(limit = 20) {
    return await supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
  }

  static async getPostsWithCategories(limit = 20) {
    return await supabase
      .from("posts")
      .select(
        `
        *,
        post_categories (
          category:categories (
            id,
            name,
            slug
          )
        )
      `
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
  }

  static async getPostsWithAuthorAndCategories(limit = 20) {
    return await supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles (
          id,
          username,
          full_name,
          avatar_url
        ),
        post_categories (
          category:categories (
            id,
            name,
            slug
          )
        )
      `
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
  }

  static async getPost(id: string) {
    return await supabase.from("posts").select("*").eq("id", id).single();
  }

  static async getPostBySlug(slug: string) {
    return await supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles (
          id,
          username,
          full_name,
          avatar_url
        ),
        post_categories (
          category:categories (
            id,
            name,
            slug
          )
        )
      `
      )
      .eq("slug", slug)
      .single();
  }

  static async createPost(
    post: Omit<Post, "id" | "created_at" | "updated_at">
  ) {
    return await supabase.from("posts").insert([post]).select().single();
  }

  static async updatePost(id: string, updates: Partial<Post>) {
    return await supabase
      .from("posts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  }

  static async deletePost(id: string) {
    return await supabase.from("posts").delete().eq("id", id);
  }

  // ========================================
  // POST-CATEGORY RELATIONSHIP OPERATIONS
  // ========================================

  static async addPostToCategory(postId: string, categoryId: string) {
    return await supabase
      .from("post_categories")
      .insert([{ post_id: postId, category_id: categoryId }]);
  }

  static async removePostFromCategory(postId: string, categoryId: string) {
    return await supabase
      .from("post_categories")
      .delete()
      .eq("post_id", postId)
      .eq("category_id", categoryId);
  }

  static async setPostCategories(postId: string, categoryIds: string[]) {
    // Remove existing categories
    await supabase.from("post_categories").delete().eq("post_id", postId);

    // Add new categories
    if (categoryIds.length > 0) {
      const relationships = categoryIds.map((categoryId) => ({
        post_id: postId,
        category_id: categoryId,
      }));

      return await supabase.from("post_categories").insert(relationships);
    }

    return { data: null, error: null };
  }

  static async getPostCategories(postId: string) {
    return await supabase
      .from("post_categories")
      .select(
        `
        category:categories (
          id,
          name,
          slug,
          description
        )
      `
      )
      .eq("post_id", postId);
  }

  static async getPostsByCategory(categoryId: string, limit = 20) {
    return await supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles (
          id,
          username,
          full_name,
          avatar_url
        ),
        post_categories!inner(category_id)
      `
      )
      .eq("post_categories.category_id", categoryId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
  }

  // ========================================
  // COMMENT OPERATIONS
  // ========================================

  static async getCommentsByPost(postId: string) {
    return await supabase
      .from("comments")
      .select(
        `
        *,
        author:profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
  }

  static async getCommentsWithReplies(postId: string) {
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        author:profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error }; // Organize comments into threaded structure
    const commentMap = new Map();
    const rootComments: (Comment & { replies: any[] })[] = [];

    comments?.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments?.forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return { data: rootComments, error: null };
  }

  static async createComment(
    comment: Omit<Comment, "id" | "created_at" | "updated_at">
  ) {
    return await supabase
      .from("comments")
      .insert([comment])
      .select(
        `
        *,
        author:profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .single();
  }

  static async updateComment(id: string, updates: Partial<Comment>) {
    return await supabase
      .from("comments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  }

  static async deleteComment(id: string) {
    return await supabase.from("comments").delete().eq("id", id);
  }

  // ========================================
  // LIKE OPERATIONS
  // ========================================

  static async likePost(userId: string, postId: string) {
    return await supabase
      .from("likes")
      .insert([{ user_id: userId, post_id: postId }])
      .select()
      .single();
  }

  static async unlikePost(userId: string, postId: string) {
    return await supabase
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);
  }

  static async isPostLikedByUser(userId: string, postId: string) {
    const { data, error } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    return { isLiked: !!data, error };
  }

  static async getPostLikeCount(postId: string) {
    const { count, error } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    return { count: count || 0, error };
  }

  static async getPostLikes(postId: string) {
    return await supabase
      .from("likes")
      .select(
        `
        *,
        user:profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
  }

  // ========================================
  // ANALYTICS & COUNTS
  // ========================================

  static async getPostCount(status?: "draft" | "published") {
    let query = supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { count } = await query;
    return count || 0;
  }

  static async getCategoryCount() {
    const { count } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });

    return count || 0;
  }

  static async getCommentCount(postId?: string) {
    let query = supabase
      .from("comments")
      .select("*", { count: "exact", head: true });

    if (postId) {
      query = query.eq("post_id", postId);
    }

    const { count } = await query;
    return count || 0;
  }

  static async getTotalLikes(postId?: string) {
    let query = supabase
      .from("likes")
      .select("*", { count: "exact", head: true });

    if (postId) {
      query = query.eq("post_id", postId);
    }

    const { count } = await query;
    return count || 0;
  }

  // ========================================
  // SEARCH OPERATIONS
  // ========================================

  static async searchPosts(searchTerm: string) {
    return await supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .or(`title.ilike.%${searchTerm}%, content.ilike.%${searchTerm}%`)
      .eq("status", "published")
      .order("published_at", { ascending: false });
  }

  static async searchCategories(searchTerm: string) {
    return await supabase
      .from("categories")
      .select("*")
      .or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`)
      .order("name");
  }
}

// Export convenience functions for easy importing
export const {
  // Profile operations
  getProfile,
  getProfileByUsername,
  getAllProfiles,
  updateProfile,

  // Category operations
  getAllCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,

  // Post operations
  getPosts,
  getPostsWithAuthor,
  getPostsWithCategories,
  getPostsWithAuthorAndCategories,
  getPost,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,

  // Post-Category relationships
  addPostToCategory,
  removePostFromCategory,
  setPostCategories,
  getPostCategories,
  getPostsByCategory,

  // Comment operations
  getCommentsByPost,
  getCommentsWithReplies,
  createComment,
  updateComment,
  deleteComment,

  // Like operations
  likePost,
  unlikePost,
  isPostLikedByUser,
  getPostLikeCount,
  getPostLikes,

  // Analytics
  getPostCount,
  getCategoryCount,
  getCommentCount,
  getTotalLikes,

  // Search
  searchPosts,
  searchCategories,
} = DatabaseOperations;
