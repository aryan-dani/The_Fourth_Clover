"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRef, useState, useEffect } from "react";
import { getPostsWithAuthor } from "@/lib/database-operations";
import { PostWithAuthor } from "@/lib/database-types";
import {
  PenTool,
  Users,
  Zap,
  Heart,
  ArrowRight,
  Star,
  TrendingUp,
  MessageCircle,
  Clock,
  Globe,
  Shield,
  Feather,
} from "lucide-react";

const features = [
  {
    icon: PenTool,
    title: "Distraction-Free Writing",
    description:
      "Clean, minimal editor focused on your words. Auto-save and markdown support included.",
  },
  {
    icon: Users,
    title: "Thoughtful Community",
    description:
      "Connect with readers who value quality content and meaningful conversations.",
  },
  {
    icon: Zap,
    title: "Fast & Elegant",
    description:
      "Lightning-fast performance with a timeless design that never gets in the way.",
  },
  {
    icon: Heart,
    title: "Built for Writers",
    description:
      "Every feature designed with writers in mind, from drafts to publication.",
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data, error: dbError } = await getPostsWithAuthor(6);
        if (dbError) {
          throw new Error(
            typeof dbError === "string"
              ? dbError
              : dbError.message || "Failed to fetch posts"
          );
        }
        if (data) {
          setPosts(data as PostWithAuthor[]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <motion.section
          ref={heroRef}
          style={{ y, opacity }}
          className="relative py-32 lg:py-40 overflow-hidden"
        >
          {/* Very subtle background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 120,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute top-20 left-10 w-32 h-32 rounded-full border border-muted/10"
            />
            <motion.div
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 160,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute bottom-20 right-10 w-48 h-48 rounded-full border border-muted/15"
            />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="text-center max-w-5xl mx-auto"
            >
              {/* Main Tagline */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight brand-text tracking-tight"
              >
                Where Stories
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60">
                  Come to Life
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="text-xl lg:text-2xl lead-text mb-10 max-w-3xl mx-auto leading-relaxed"
              >
                Where modern storytelling meets minimalist design. Share your
                voice, build meaningful connections, and discover stories that
                matter.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.5,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button
                  size="lg"
                  asChild
                  className="rounded-full px-8 py-3 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 ease-out medium-hover group ui-text"
                >
                  <Link href={user ? "/write" : "/auth/signup"}>
                    <Feather className="mr-2 w-5 h-5 group-hover:rotate-3 transition-transform duration-300" />
                    {user ? "Start Writing" : "Begin Your Journey"}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="rounded-full px-8 py-3 font-medium border-2 hover:bg-foreground hover:text-background transition-all duration-300 ease-out group ui-text"
                >
                  <Link href="/explore">
                    <Globe className="mr-2 w-5 h-5 group-hover:rotate-6 transition-transform duration-300" />
                    Explore Stories
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Featured Posts */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-foreground text-background px-4 py-1.5 rounded-full mb-4 text-sm font-medium">
                Featured Stories
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-3 brand-text tracking-tight">
                Stories That Inspire
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover exceptional writing from our community
              </p>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 max-w-6xl mx-auto">
              {loading &&
                Array.from({ length: 3 }).map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <Card className="h-full">
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-3" />
                        <Skeleton className="h-16 w-full mb-4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              {error && <p className="text-destructive col-span-3">{error}</p>}
              {!loading &&
                !error &&
                posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="medium-card medium-hover"
                  >
                    <Link href={`/post/${post.slug}`} className="block h-full">
                      <Card className="group overflow-hidden border-2 hover:border-primary/30 shadow-sm hover:shadow-lg transition-all duration-300 ease-out bg-card/90 backdrop-blur-sm h-full">
                        {post.cover_image && (
                          <div className="aspect-[4/3] overflow-hidden relative">
                            <img
                              src={post.cover_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        )}
                        <CardHeader className={post.cover_image ? "pb-3" : "pb-3 pt-5"}>
                          <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="w-8 h-8 ring-2 ring-background">
                              <AvatarImage src={post.author?.avatar_url || ""} />
                              <AvatarFallback className="bg-foreground text-background font-semibold text-xs">
                                {post.author?.full_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate ui-text text-sm">
                                {post.author?.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground ui-text">
                                @{post.author?.username}
                              </p>
                            </div>
                          </div>
                          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors brand-text text-lg leading-tight">
                            {post.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-5">
                          <p className="text-muted-foreground mb-3 line-clamp-2 leading-relaxed content text-sm">
                            {post.excerpt}
                          </p>

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {post.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="rounded-full text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground ui-text">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {post.read_time}m
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {post.likes[0]?.count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {post.comments[0]?.count || 0}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-10"
            >
              <Button
                variant="outline"
                asChild
                className="rounded-full px-8 py-3 border-2 hover:bg-foreground hover:text-background transition-all duration-300"
              >
                <Link href="/explore">
                  View All Stories
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-20 bg-foreground text-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 brand-text tracking-tight">
                Why Choose The Fourth Clover?
              </h2>
              <p className="text-lg lead-text text-background/80 max-w-2xl mx-auto">
                Built for writers who value simplicity and quality
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Feather,
                  title: "Clean Writing",
                  description:
                    "Distraction-free editor with autosave and markdown support",
                },
                {
                  icon: Users,
                  title: "Quality Community",
                  description:
                    "Connect with thoughtful readers who appreciate good writing",
                },
                {
                  icon: Zap,
                  title: "Fast & Simple",
                  description:
                    "Minimalist design that loads quickly and works everywhere",
                },
                {
                  icon: Shield,
                  title: "Privacy First",
                  description:
                    "Your data is yours. No tracking, no ads, just pure writing",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="text-center group medium-hover"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="w-14 h-14 rounded-full bg-background/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-background/20 transition-colors duration-300"
                  >
                    <feature.icon className="w-7 h-7 text-background" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2 brand-text">
                    {feature.title}
                  </h3>
                  <p className="text-background/70 text-sm leading-relaxed content">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-20 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 brand-text tracking-tight">
                Ready to Share Your Story?
              </h2>
              <p className="text-lg lead-text mb-8 max-w-2xl mx-auto">
                Join thousands of writers who have found their voice on The
                Fourth Clover. Your story matters.
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <Button
                  size="lg"
                  asChild
                  className="rounded-full px-10 py-5 text-lg font-semibold bg-foreground text-background hover:bg-foreground/90 shadow-lg hover:shadow-xl transition-all duration-300 ease-out medium-hover ui-text"
                >
                  <Link href={user ? "/write" : "/auth/signup"}>
                    Start Writing Today
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-6 text-sm text-muted-foreground ui-text"
              >
                Free forever. No credit card required.
              </motion.p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
