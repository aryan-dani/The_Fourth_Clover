"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { logSupabaseError } from "@/lib/debug-supabase";
import {
  formatDate,
  shareToTwitter,
  shareToWhatsApp,
  copyToClipboard,
} from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { toast } from "sonner";
import {
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Calendar,
  Twitter,
  Send,
  Copy,
  ArrowLeft,
  Loader2,
  Reply,
} from "lucide-react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  tags: string[];
  read_time: number;
  created_at: string;
  published_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
    if (user) {
      checkIfLiked();
    }
  }, [params.slug, user]);

  const fetchPost = async () => {
    try {
      console.log("🔍 Fetching post with slug:", params.slug);

      // First, get the post
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", params.slug)
        .eq("status", "published")
        .single();

      if (postError) {
        console.error("❌ Error fetching post:", postError);
        if (postError.code === "PGRST116") {
          notFound();
        }
        throw postError;
      }

      if (!postData) {
        console.error("❌ No post found with slug:", params.slug);
        notFound();
        return;
      }

      // Then, get the author profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url, bio")
        .eq("id", postData.author_id)
        .single();

      if (profileError) {
        console.warn("⚠️ Could not fetch author profile:", profileError);
        // Continue without profile data
      }

      // Combine the data
      const combinedData = {
        ...postData,
        profiles: profileData || {
          username: "Anonymous",
          full_name: "Anonymous User",
          avatar_url: null,
          bio: null,
        },
      };

      console.log("✅ Post fetched successfully:", combinedData);
      setPost(combinedData);

      // Get likes count
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postData.id);

      setLikesCount(count || 0);
    } catch (error) {
      console.error("❌ Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!post?.id) return;

    try {
      console.log("🔍 Fetching comments for post:", post.id);

      // Fetch comments without the problematic profile join
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", post.id)
        .order("created_at", { ascending: false });

      if (commentsError) {
        console.error("❌ Error fetching comments:", commentsError);
        throw commentsError;
      }

      // Fetch profiles for comment authors separately
      const authorIds = Array.from(
        new Set(commentsData?.map((comment) => comment.author_id) || [])
      );

      let profilesData: any[] = [];
      if (authorIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", authorIds);

        if (profilesError) {
          console.warn(
            "⚠️ Could not fetch comment author profiles:",
            profilesError
          );
        } else {
          profilesData = profiles || [];
        }
      }

      // Combine comments with their profile data
      const commentsWithProfiles =
        commentsData?.map((comment) => ({
          ...comment,
          profiles: profilesData.find(
            (profile) => profile.id === comment.author_id
          ) || {
            username: "Anonymous",
            full_name: "Anonymous User",
            avatar_url: null,
          },
        })) || [];

      // Organize comments with replies
      const topLevelComments = commentsWithProfiles.filter(
        (comment) => !comment.parent_id
      );
      const repliesMap = new Map();

      commentsWithProfiles.forEach((comment) => {
        if (comment.parent_id) {
          if (!repliesMap.has(comment.parent_id)) {
            repliesMap.set(comment.parent_id, []);
          }
          repliesMap.get(comment.parent_id).push(comment);
        }
      });

      const commentsWithReplies = topLevelComments.map((comment) => ({
        ...comment,
        replies: repliesMap.get(comment.id) || [],
      }));

      console.log(
        "✅ Comments fetched successfully:",
        commentsWithReplies.length
      );
      setComments(commentsWithReplies);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !post) return;

    try {
      console.log("❤️ Checking if user liked post:", {
        post_id: post.id,
        user_id: user.id,
      });

      const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 means no rows found, which is expected if user hasn't liked
        logSupabaseError("Check If Liked", error, {
          post_id: post.id,
          user_id: user.id,
        });
        console.warn("⚠️ Error checking if liked:", error);
        return;
      }

      if (!error && data) {
        console.log("✅ User has liked this post");
        setIsLiked(true);
      } else {
        console.log("ℹ️ User has not liked this post");
      }
    } catch (error) {
      console.error("❌ Unexpected error checking if liked:", error);
    }
  };

  const toggleLike = async () => {
    if (!user || !post) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      console.log(`${isLiked ? "💔" : "❤️"} Toggling like for post:`, {
        post_id: post.id,
        user_id: user.id,
        current_state: isLiked ? "liked" : "not_liked",
      });

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) {
          logSupabaseError("Remove Like", error, {
            post_id: post.id,
            user_id: user.id,
          });
          throw error;
        }

        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
        console.log("✅ Like removed successfully");
        toast.success("Like removed");
      } else {
        // Add like
        const { error } = await supabase.from("likes").insert({
          post_id: post.id,
          user_id: user.id,
        });

        if (error) {
          logSupabaseError("Add Like", error, {
            post_id: post.id,
            user_id: user.id,
          });
          throw error;
        }

        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        console.log("✅ Like added successfully");
        toast.success("Post liked! ❤️");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const submitComment = async () => {
    if (!user || !post || !newComment.trim()) {
      toast.error("Please sign in and enter a comment");
      return;
    }

    setSubmittingComment(true);
    try {
      console.log("💬 Submitting comment:", {
        post_id: post.id,
        author_id: user.id,
        content: newComment.trim(),
        parent_id: replyTo,
      });

      const { error } = await supabase.from("comments").insert({
        post_id: post.id,
        author_id: user.id,
        content: newComment.trim(),
        parent_id: replyTo,
      });

      if (error) {
        logSupabaseError("Submit Comment", error, {
          post_id: post.id,
          author_id: user.id,
          content_length: newComment.trim().length,
          parent_id: replyTo,
        });
        throw error;
      }

      console.log("✅ Comment submitted successfully");
      setNewComment("");
      setReplyTo(null);
      fetchComments();
      toast.success("Comment added! 💬");
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = (platform: "twitter" | "whatsapp" | "copy") => {
    if (!post) return;

    const url = window.location.href;

    switch (platform) {
      case "twitter":
        shareToTwitter(post.title, url);
        break;
      case "whatsapp":
        shareToWhatsApp(post.title, url);
        break;
      case "copy":
        copyToClipboard(url);
        toast.success("Link copied to clipboard! 📋");
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="aspect-video bg-muted rounded"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button variant="ghost" asChild className="hover:bg-accent ui-text">
              <Link href="/explore" className="flex items-center ui-text">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Explore
              </Link>
            </Button>
          </motion.div>

          {/* Article Header */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <header className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight brand-text">
                {post.title}
              </h1>

              {/* Author Info */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <Link
                  href={`/profile/${post.profiles.username}`}
                  className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={post.profiles.avatar_url || ""} />
                    <AvatarFallback>
                      {post.profiles.full_name?.[0] ||
                        post.profiles.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold ui-text">
                      {post.profiles.full_name || post.profiles.username}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground ui-text">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.read_time} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Engagement Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={toggleLike}
                    className={`flex items-center space-x-2 transition-all ${
                      isLiked ? "glow-button animate-pulse-slow" : "glass-hover"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                    />
                    <span>{likesCount}</span>
                  </Button>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("twitter")}
                      className="glass-hover"
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("whatsapp")}
                      className="glass-hover"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("copy")}
                      className="glass-hover"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="hover:bg-accent transition-colors"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Cover Image */}
              {post.cover_image && (
                <div className="aspect-video rounded-lg overflow-hidden mb-8">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </header>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none mb-12">
              {post.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-6 leading-relaxed text-lg content">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.article>

          {/* Comments Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center brand-text">
                  <MessageCircle className="w-6 h-6 mr-2" />
                  Comments (
                  {comments.reduce(
                    (total, comment) =>
                      total + 1 + (comment.replies?.length || 0),
                    0
                  )}
                  )
                </h2>

                {/* Add Comment */}
                {user ? (
                  <div className="mb-8">
                    <div className="flex space-x-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user.user_metadata?.full_name?.[0] ||
                            user.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        {replyTo && (
                          <div className="mb-2 text-sm text-muted-foreground">
                            Replying to comment...
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyTo(null)}
                              className="ml-2 h-auto p-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        <Textarea
                          placeholder={
                            replyTo
                              ? "Write a reply..."
                              : "Share your thoughts..."
                          }
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="mb-3 focus-ring"
                          rows={3}
                        />
                        <Button
                          onClick={submitComment}
                          disabled={!newComment.trim() || submittingComment}
                          size="sm"
                          className="glow-button"
                        >
                          {submittingComment && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {replyTo ? "Post Reply" : "Post Comment"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 p-4 border border-dashed border-border rounded-lg text-center glass">
                    <p className="text-muted-foreground mb-4">
                      Sign in to join the conversation 💬
                    </p>
                    <Button asChild className="glow-button">
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id}>
                      {/* Main Comment */}
                      <div className="flex space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={comment.profiles.avatar_url || ""}
                          />
                          <AvatarFallback>
                            {comment.profiles.full_name?.[0] ||
                              comment.profiles.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="font-semibold">
                              {comment.profiles.full_name ||
                                comment.profiles.username}
                            </p>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-foreground leading-relaxed mb-2">
                            {comment.content}
                          </p>
                          {user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyTo(comment.id)}
                              className="text-xs hover:bg-accent"
                            >
                              <Reply className="w-3 h-3 mr-1" />
                              Reply
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-14 mt-4 space-y-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage
                                  src={reply.profiles.avatar_url || ""}
                                />
                                <AvatarFallback className="text-xs">
                                  {reply.profiles.full_name?.[0] ||
                                    reply.profiles.username[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="font-semibold text-sm">
                                    {reply.profiles.full_name ||
                                      reply.profiles.username}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(reply.created_at)}
                                  </span>
                                </div>
                                <p className="text-foreground leading-relaxed text-sm">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-float" />
                      <p className="text-muted-foreground">
                        No comments yet. Be the first to share your thoughts! ✨
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
