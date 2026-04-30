"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { logSupabaseError } from "@/lib/dev/debug-supabase";
import {
  formatDate,
  shareToTwitter,
  shareToWhatsApp,
  copyToClipboard,
} from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageShell } from "@/components/layout/PageShell";
import { motionEase } from "@/lib/motion";
import { toast } from "sonner";
import {
  Heart,
  Clock,
  Calendar,
  Twitter,
  Send,
  Copy,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { CommentSection } from "@/features/comments/components/CommentSection";
import { PostWithAuthor } from "@/types/database";
import { postContentToBlocks } from "@/lib/post-content";

type PostPageClientProps = {
  initialPost: PostWithAuthor;
};

export function PostPageClient({ initialPost }: PostPageClientProps) {
  const { user } = useAuth();
  const [post] = useState<PostWithAuthor>(initialPost);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(
    initialPost.likes?.[0]?.count ?? 0
  );

  const checkIfLiked = useCallback(async (postId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        logSupabaseError("Check If Liked", error, { postId, userId });
        return;
      }
      setIsLiked(!!data);
    } catch (error) {
      console.error("Unexpected error checking if liked:", error);
    }
  }, []);

  useEffect(() => {
    if (!post?.id) return;
    const uid = user?.id;
    if (!uid) {
      setIsLiked(false);
      return;
    }
    void checkIfLiked(post.id, uid);
  }, [post?.id, user?.id, checkIfLiked]);

  const toggleLike = async () => {
    if (!user || !post) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      if (isLiked) {
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
        toast.success("Like removed");
      } else {
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
        toast.success("Post liked");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
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
        toast.success("Link copied to clipboard");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="flex-1 pt-20 pb-8">
        <PageShell
          variant="reading"
          className="max-w-[min(56rem,calc(100vw-2rem))] lg:max-w-[60rem]"
        >
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: motionEase }}
            className="mb-6"
          >
            <Button variant="ghost" asChild className="hover:bg-accent ui-text">
              <Link href="/explore" className="flex items-center ui-text">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Explore
              </Link>
            </Button>
          </motion.div>

          <motion.article
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: motionEase }}
            className="mb-8"
          >
            <header className="mb-8">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl mb-6 leading-tight">
                {post.title}
              </h1>

              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <Link
                  href={`/profile/${post.author.username}`}
                  className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={post.author.avatar_url || ""} />
                    <AvatarFallback>
                      {post.author.full_name?.[0] || post.author.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold ui-text">
                      {post.author.full_name || post.author.username}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground ui-text">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.published_at!)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.read_time} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={toggleLike}
                    className={`flex items-center space-x-2 ${
                      isLiked
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:border-primary/40 hover:bg-primary/10"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                    <span className="font-semibold">{likesCount}</span>
                  </Button>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("twitter")}
                      className="hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-500 transition-all duration-300"
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("whatsapp")}
                      className="hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-500 transition-all duration-300"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("copy")}
                      className="hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {post.tags && post.tags.length > 0 && (
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

              {post.cover_image && (
                <div className="aspect-video rounded-lg overflow-hidden mb-8 relative">
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 960px"
                    priority
                  />
                </div>
              )}
            </header>

            <div className="prose prose-lg max-w-none mb-12 font-serif">
              {postContentToBlocks(post.content).map((block, index) =>
                block.kind === "spacer" ? (
                  <div
                    key={`s-${index}`}
                    className="h-4 sm:h-5"
                    aria-hidden
                  />
                ) : (
                  <p
                    key={`p-${index}`}
                    className="mb-3 leading-relaxed text-lg text-muted-foreground content md:text-xl sm:mb-4"
                  >
                    {block.text}
                  </p>
                )
              )}
            </div>
          </motion.article>

          <CommentSection postId={post.id} />
        </PageShell>
      </main>

      <Footer />
    </div>
  );
}
