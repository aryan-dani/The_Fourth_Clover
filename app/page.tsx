"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRef } from "react";
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
  Sparkles,
  Globe,
  Shield,
  Feather,
} from "lucide-react";

const featuredPosts = [
  {
    id: "1",
    title: "The Art of Minimalist Writing",
    excerpt:
      "Exploring how simplicity in prose can create profound impact and connect deeply with readers.",
    author: {
      name: "Elena Martinez",
      avatar:
        "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
      username: "elenamartinez",
    },
    cover:
      "https://images.pexels.com/photos/6765867/pexels-photo-6765867.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=2",
    tags: ["Writing", "Minimalism", "Craft"],
    readTime: 6,
    createdAt: "2024-01-15",
    likes: 89,
    comments: 12,
  },
  {
    id: "2",
    title: "Building Digital Mindfulness",
    excerpt:
      "How to create intentional digital habits that support creativity and well-being in our connected world.",
    author: {
      name: "David Chen",
      avatar:
        "https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
      username: "davidchen",
    },
    cover:
      "https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=2",
    tags: ["Mindfulness", "Technology", "Wellness"],
    readTime: 8,
    createdAt: "2024-01-14",
    likes: 124,
    comments: 18,
  },
  {
    id: "3",
    title: "The Power of Slow Journalism",
    excerpt:
      "Why taking time to deeply research and thoughtfully craft stories matters more than ever.",
    author: {
      name: "Sarah Kim",
      avatar:
        "https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
      username: "sarahkim",
    },
    cover:
      "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=2",
    tags: ["Journalism", "Media", "Ethics"],
    readTime: 5,
    createdAt: "2024-01-13",
    likes: 67,
    comments: 9,
  },
];

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
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="flex justify-center items-center mb-12"
              >
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-xl">
                    <span className="text-4xl text-background">🍀</span>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 60,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full border border-dashed border-foreground/10"
                  />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="text-5xl lg:text-7xl font-black mb-6 leading-tight brand-text tracking-tight"
              >
                THE FOURTH
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
                  CLOVER
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

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500/60" />
                  1,000+ Writers
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500/60" />
                  5,000+ Stories
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500/60" />
                  50,000+ Readers
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Featured Posts */}
        <section className="py-24 lg:py-32 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full mb-6 font-medium"
              >
                <Sparkles className="w-4 h-4" />
                Featured Stories
              </motion.div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 brand-text tracking-tight">
                Stories That Inspire
              </h2>
              <p className="text-xl lead-text max-w-2xl mx-auto leading-relaxed">
                Discover exceptional writing from our community of thoughtful
                creators
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {featuredPosts.map((post, index) => (
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
                  <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 ease-out bg-card/90 backdrop-blur-sm h-full">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img
                        src={post.cover}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="w-10 h-10 ring-2 ring-background">
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback className="bg-foreground text-background font-semibold">
                            {post.author.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate ui-text">
                            {post.author.name}
                          </p>
                          <p className="text-sm text-muted-foreground ui-text">
                            @{post.author.username}
                          </p>
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors brand-text text-xl leading-tight">
                        <Link
                          href={`/post/${post.id}`}
                          className="hover:underline"
                        >
                          {post.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                      <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed content">
                        {post.excerpt}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
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

                      <div className="flex items-center justify-between text-sm text-muted-foreground ui-text">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}m read
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments}
                          </span>
                        </div>
                        <span className="text-xs">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-16"
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
        <section className="py-24 lg:py-32 bg-foreground text-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 brand-text tracking-tight">
                Why Choose The Fourth Clover?
              </h2>
              <p className="text-xl lead-text text-background/80 max-w-2xl mx-auto leading-relaxed">
                Built for writers who value simplicity, quality, and meaningful
                connections
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
                    className="w-16 h-16 rounded-full bg-background/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-background/20 transition-colors duration-300"
                  >
                    <feature.icon className="w-8 h-8 text-background" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3 brand-text">
                    {feature.title}
                  </h3>
                  <p className="text-background/70 leading-relaxed content">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 lg:py-32 bg-gradient-to-br from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-6xl mb-8"
              >
                🍀
              </motion.div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 brand-text tracking-tight">
                Ready to Share Your Story?
              </h2>
              <p className="text-xl lead-text mb-10 max-w-2xl mx-auto leading-relaxed">
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
                  className="rounded-full px-12 py-6 text-xl font-semibold bg-foreground text-background hover:bg-foreground/90 shadow-lg hover:shadow-xl transition-all duration-300 ease-out medium-hover ui-text"
                >
                  <Link href={user ? "/write" : "/auth/signup"}>
                    <Sparkles className="mr-3 w-6 h-6" />
                    Start Writing Today
                    <ArrowRight className="ml-3 w-6 h-6" />
                  </Link>
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-8 text-sm text-muted-foreground ui-text"
              >
                Free forever. No credit card required.
              </motion.p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
