"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelativeTime } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Search,
  Heart,
  MessageCircle,
  Clock,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { getPostsWithAuthor, getAllTags } from "@/lib/database-operations";
import { PostWithAuthor } from "@/lib/database-types";

export default function ExplorePage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "trending" | "popular">(
    "latest"
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [postsResult, tagsResult] = await Promise.all([
          getPostsWithAuthor(),
          getAllTags(),
        ]);

        if (postsResult.error) throw postsResult.error;

        const formattedPosts = (postsResult.data || []).map((p: any) => ({
          ...p,
          likes_count: p.likes?.[0]?.count || 0,
          comments_count: p.comments?.[0]?.count || 0,
        }));

        setPosts(formattedPosts as PostWithAuthor[]);
        setAllTags(tagsResult || []);
      } catch (error) {
        console.error("Error fetching explore page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const filteredPosts = useMemo(() => {
    let filtered: PostWithAuthor[] = [...posts];

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post: PostWithAuthor) =>
          post.title.toLowerCase().includes(lowercasedTerm) ||
          (post.excerpt &&
            post.excerpt.toLowerCase().includes(lowercasedTerm)) ||
          post.author.full_name?.toLowerCase().includes(lowercasedTerm)
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((post: PostWithAuthor) =>
        post.tags?.includes(selectedTag)
      );
    }

    switch (sortBy) {
      case "trending":
        filtered.sort(
          (a: PostWithAuthor, b: PostWithAuthor) =>
            (b.likes[0]?.count || 0) +
            (b.comments[0]?.count || 0) -
            ((a.likes[0]?.count || 0) + (a.comments[0]?.count || 0))
        );
        break;
      case "popular":
        filtered.sort(
          (a: PostWithAuthor, b: PostWithAuthor) =>
            (b.likes[0]?.count || 0) - (a.likes[0]?.count || 0)
        );
        break;
      case "latest":
      default:
        filtered.sort(
          (a: PostWithAuthor, b: PostWithAuthor) =>
            new Date(b.published_at!).getTime() -
            new Date(a.published_at!).getTime()
        );
        break;
    }

    return filtered;
  }, [posts, searchTerm, selectedTag, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="glass animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Discover Amazing{" "}
            <span className="gradient-text">
              Stories
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Explore the latest posts from our community of writers and find your
            next favorite read.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="glass border-2 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search posts, authors, or topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border-2 focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Sort Tabs */}
                <Tabs
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as any)}
                  className="w-full lg:w-auto"
                >
                  <TabsList className="grid w-full grid-cols-3 lg:w-auto h-12">
                    <TabsTrigger
                      value="latest"
                      className="flex items-center space-x-2"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Latest</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="trending"
                      className="flex items-center space-x-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Trending</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="popular"
                      className="flex items-center space-x-2"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Popular</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedTag === "" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTag("")}
                      className="transition-all hover:scale-105"
                    >
                      All Topics
                    </Button>
                    {allTags.slice(0, 8).map((tag) => (
                      <Button
                        key={tag}
                        variant={selectedTag === tag ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setSelectedTag(selectedTag === tag ? "" : tag)
                        }
                        className="transition-all hover:scale-105"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Posts Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters to find what
                you&apos;re looking for.
              </p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {filteredPosts.map((post: PostWithAuthor, index: number) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="break-inside-avoid mb-8"
                >
                  <Link href={`/post/${post.slug}`} className="block">
                    <Card className="group overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 glass border-2 hover:border-primary/30 hover:-translate-y-2 cursor-pointer">
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
                        <div className="flex items-center space-x-4 mb-4">
                          <Avatar className="ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                            <AvatarImage src={post.author.avatar_url || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                              {post.author.full_name?.[0] || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">
                              {post.author.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{post.author.username}
                            </p>
                          </div>
                        </div>

                        <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                          {post.title}
                        </h3>

                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                          {post.excerpt}
                        </p>

                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 3).map((tag: string) => (
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

                        {/* Footer */}
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

        {/* Load More */}
        {filteredPosts.length > 0 && filteredPosts.length % 9 === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg">
              Load More Posts
            </Button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
