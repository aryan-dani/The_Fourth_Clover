"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Heart,
  MessageCircle,
  Clock,
  Calendar,
  Globe,
  Twitter,
  Github,
  FileText,
  Users,
} from "lucide-react";
import Link from "next/link";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  tags: string[];
  read_time: number;
  published_at: string;
  likes: { count: number }[];
  comments: { count: number }[];
}

export default function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, [params.username]);

  const fetchProfile = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", params.username)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          notFound();
        }
        throw profileError;
      }

      setProfile(profileData);

      // Fetch user's published posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          *,
          likes (count),
          comments (count)
        `
        )
        .eq("author_id", profileData.id)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (postsError) throw postsError;

      setPosts(postsData || []);

      // Calculate stats
      const totalLikes =
        postsData?.reduce(
          (sum, post) => sum + (post.likes?.[0]?.count || 0),
          0
        ) || 0;
      const totalComments =
        postsData?.reduce(
          (sum, post) => sum + (post.comments?.[0]?.count || 0),
          0
        ) || 0;

      setStats({
        totalPosts: postsData?.length || 0,
        totalLikes,
        totalComments,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-24 h-24 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Avatar className="w-24 h-24 mx-auto mb-6">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="text-2xl">
                {profile.full_name?.[0] || profile.username[0]}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-3xl font-bold mb-2">
              {profile.full_name || profile.username}
            </h1>
            <p className="text-muted-foreground text-lg mb-4">
              @{profile.username}
            </p>

            {profile.bio && (
              <p className="text-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Social Links */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              {profile.website && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
              {profile.twitter && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </a>
                </Button>
              )}
              {profile.github && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </a>
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold">{stats.totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Likes</p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MessageCircle className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{stats.totalComments}</p>
                  <p className="text-sm text-muted-foreground">Comments</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Posts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-8">
              Posts by {profile.full_name || profile.username}
            </h2>

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  {profile.full_name || profile.username} hasn&apos;t published
                  any posts yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 glass h-full">
                      {post.cover_image && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-6 flex flex-col flex-1">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          <Link href={`/post/${post.slug}`}>{post.title}</Link>
                        </h3>

                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                          {post.excerpt}
                        </p>

                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{post.read_time}m read</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="w-3 h-3" />
                              <span>{post.likes?.[0]?.count || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>{post.comments?.[0]?.count || 0}</span>
                            </div>
                          </div>
                          <span>{formatRelativeTime(post.published_at)}</span>
                        </div>
                      </CardContent>
                    </Card>
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
