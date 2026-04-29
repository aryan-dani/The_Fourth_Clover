"use client";

import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageShell } from "@/components/layout/PageShell";
import {
  Heart,
  MessageCircle,
  Clock,
  Globe,
  Twitter,
  Github,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { getProfileByUsername, getUserPosts } from "@/features/data/database-operations";
import { Profile, Post } from "@/types/database";

type PostWithCounts = Post & {
  likes: { count: number }[];
  comments: { count: number }[];
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Decode the username in case it has URL-encoded characters (like spaces)
        const decodedUsername = decodeURIComponent(username);

        // Fetch profile
        const { data: profileData, error: profileError } =
          await getProfileByUsername(decodedUsername);

        if (profileError || !profileData) {
          notFound();
        }

        setProfile(profileData);

        // Fetch user's published posts
        const { data: postsData, error: postsError } = await getUserPosts(
          profileData.id,
          "published"
        );

        if (postsError) throw postsError;

        const formattedPosts = postsData || [];
        setPosts(formattedPosts);

        // Calculate stats
        const totalLikes = formattedPosts.reduce(
          (sum, post) => sum + (post.likes?.[0]?.count || 0),
          0
        );
        const totalComments = formattedPosts.reduce(
          (sum, post) => sum + (post.comments?.[0]?.count || 0),
          0
        );

        setStats({
          totalPosts: formattedPosts.length,
          totalLikes,
          totalComments,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex-1 pt-20 pb-8">
          <PageShell variant="wide" className="max-w-4xl">
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
          </PageShell>
        </main>
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

      <main className="flex-1 pt-20 pb-8">
        <PageShell variant="wide" className="max-w-4xl">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="relative inline-block mb-4">
              <Avatar className="h-28 w-28 mx-auto ring-4 ring-primary/25 ring-offset-4 ring-offset-background">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/30 to-primary/10">
                  {profile.full_name?.[0] || profile.username[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -inset-1 rounded-full bg-primary/15 blur-xl -z-10" aria-hidden />
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-2">
              {profile.full_name || profile.username}
            </h1>
            <p className="font-sans text-muted-foreground text-base md:text-lg mb-5">
              @{profile.username}
            </p>

            {profile.bio && (
              <p className="font-serif text-foreground max-w-2xl mx-auto mb-5 leading-relaxed text-base md:text-lg">
                {profile.bio}
              </p>
            )}

            {/* Social Links */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {profile.website && (
                <Button variant="outline" size="sm" asChild className="hover:border-primary/50 hover:bg-primary/10 transition-all">
                  <a
                    href={profile.website.startsWith('http://') || profile.website.startsWith('https://')
                      ? profile.website
                      : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
              {profile.twitter && (
                <Button variant="outline" size="sm" asChild className="hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-500 transition-all">
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
                <Button variant="outline" size="sm" asChild className="hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-500 transition-all">
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
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto">
              <Card className="glass border hover:border-primary/30 transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2 p-2 rounded-full bg-muted/60 w-fit mx-auto">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {stats.totalPosts}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">Posts</p>
                </CardContent>
              </Card>

              <Card className="glass border hover:border-primary/30 transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2 p-2 rounded-full bg-muted/60 w-fit mx-auto">
                    <Heart className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {stats.totalLikes}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">Likes</p>
                </CardContent>
              </Card>

              <Card className="glass border hover:border-primary/30 transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2 p-2 rounded-full bg-muted/60 w-fit mx-auto">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {stats.totalComments}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">Comments</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Posts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-5 border-b border-border/60 pb-3 text-center sm:text-left">
              Posts by {profile.full_name || profile.username}
            </h2>

            {posts.length === 0 ? (
              <div className="text-center py-10">
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
                    <Link href={`/post/${post.slug}`} className="block h-full">
                      <Card className="group overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 glass h-full border-2 hover:border-primary/30 hover:-translate-y-2 cursor-pointer">
                        {post.cover_image && (
                          <div className="aspect-video overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                            <img
                              src={post.cover_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <CardContent className="p-6 flex flex-col flex-1">
                          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                            {post.title}
                          </h3>

                          <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                            {post.excerpt}
                          </p>

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs hover:bg-primary/20 transition-colors"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-primary/10">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1 hover:text-primary transition-colors">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{post.read_time}m read</span>
                              </div>
                              <div className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                                <Heart className="w-3.5 h-3.5" />
                                <span>{post.likes[0]?.count || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{post.comments[0]?.count || 0}</span>
                              </div>
                            </div>
                            <span>
                              {post.published_at
                                ? formatRelativeTime(post.published_at)
                                : ""}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </PageShell>
      </main>

      <Footer />
    </div>
  );
}
