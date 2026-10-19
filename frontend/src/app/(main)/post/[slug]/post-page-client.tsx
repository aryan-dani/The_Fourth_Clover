"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { logSupabaseError } from "@/lib/dev/debug-supabase";
import {
  formatDate,
  formatRelativeTime,
  shareToTwitter,
  shareToWhatsApp,
  copyToClipboard,
  toTitleCase,
  getCurrentWeekKey,
  formatLinkedinRepostCopy,
} from "@/lib/utils";
import {
  approvePublicationPostAction,
  selectWeeklyLinkedinPickAction,
  superAdminDeletePostAction,
} from "@/features/data/server-actions";
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
  ListTree,
  BookOpen,
  Edit3,
  ShieldCheck,
  Award,
  CheckCircle2,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import { CommentSection } from "@/features/comments/components/CommentSection";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { extractHeadings } from "@/lib/post-content";
import type { PostWithAuthor, PublicationRole } from "@/types/database";

type PostPageClientProps = {
  initialPost: PostWithAuthor;
  publicationSlug?: string;
  publicationName?: string;
  relatedPosts?: PostWithAuthor[];
  authorRole?: PublicationRole | null;
  viewerRole?: PublicationRole | null;
  editorUserIds?: string[];
};

export function PostPageClient({
  initialPost,
  publicationSlug,
  publicationName,
  relatedPosts = [],
  authorRole,
  viewerRole,
  editorUserIds = [],
}: PostPageClientProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [post, setPost] = useState<PostWithAuthor>(initialPost);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(
    initialPost.likes?.[0]?.count ?? 0,
  );
  const [copiedLinkedin, setCopiedLinkedin] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentWeekKey = getCurrentWeekKey();

  const isCsiPost =
    publicationSlug === "csi" ||
    post.publication?.slug === "csi" ||
    Boolean(post.publication_id);

  const isSuperAdmin = Boolean(profile?.is_admin);
  const isCsiEditor =
    isSuperAdmin ||
    viewerRole === "editor" ||
    Boolean(user?.id && editorUserIds.includes(user.id));
  const isAuthor = Boolean(user?.id && user.id === post.author_id);

  const headings = useMemo(
    () => extractHeadings(post.content),
    [post.content],
  );
  const showToc =
    headings.length >= 2 &&
    (isCsiPost || (post.content?.length ?? 0) >= 800);

  const checkIfLiked = useCallback(async (postId: string, userId: string) => {
    try {
      // maybeSingle avoids PostgREST 406 when the user has not liked yet
      // (.single() requests an object and 0 rows → HTTP 406).
      const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
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

  const handleApprovePost = () => {
    startTransition(async () => {
      const result = await approvePublicationPostAction(post.id);
      if (!result.ok) {
        toast.error(result.error || "Failed to approve post.");
        return;
      }
      setPost((prev) => ({
        ...prev,
        status: "published",
        published_at: prev.published_at || new Date().toISOString(),
      }));
      toast.success("Post approved and published to CSI Tech Blog!");
      router.refresh();
    });
  };

  const handleSelectWeeklyLinkedin = () => {
    startTransition(async () => {
      const result = await selectWeeklyLinkedinPickAction(
        post.id,
        currentWeekKey,
      );
      if (!result.ok) {
        toast.error(result.error || "Could not select Wednesday LinkedIn pick.");
        return;
      }
      setPost((prev) => ({
        ...prev,
        status: "published",
        published_at: prev.published_at || new Date().toISOString(),
        linkedin_pick_week: result.weekKey || currentWeekKey,
      }));
      toast.success(
        `Selected as official CSI Wednesday LinkedIn post (${result.weekKey || currentWeekKey})!`,
      );
      router.refresh();
    });
  };

  const handleCopyLinkedinCaption = async () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://thefourthclover.tech";
    const postUrl = isCsiPost
      ? `${origin}/csi/${post.slug}`
      : `${origin}/post/${post.slug}`;
    const text = formatLinkedinRepostCopy({
      title: post.title,
      authorName: post.author.full_name || post.author.username,
      excerpt: post.excerpt,
      url: postUrl,
      tags: post.tags,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLinkedin(true);
      toast.success("Copied CSI LinkedIn repost caption!");
      setTimeout(() => setCopiedLinkedin(false), 2500);
    } catch {
      toast.error("Failed to copy caption.");
    }
  };

  const handleDeletePost = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Permanently delete "${post.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await superAdminDeletePostAction(post.id);
      if (!result.ok) {
        toast.error(result.error || "Failed to delete post.");
        return;
      }
      toast.success("Post deleted.");
      router.push(isCsiPost ? "/csi" : "/explore");
      router.refresh();
    });
  };

  const backHref = isCsiPost ? "/csi" : "/explore";
  const backText = isCsiPost
    ? `Back to ${publicationName || "CSI Tech Blog"}`
    : "Back to Explore";
  const publishedOrCreatedDate = post.published_at || post.created_at;

  return (
    <div className="min-h-screen bg-background">
      <LazyMotion features={domAnimation}>
        <PageShell
          variant="reading"
          className="max-w-[min(56rem,calc(100vw-2rem))] lg:max-w-[60rem]"
        >
          <m.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: motionEase }}
            className="mb-6 flex flex-wrap items-center justify-between gap-3"
          >
            <Button variant="ghost" asChild className="hover:bg-accent ui-text">
              <Link href={backHref} className="flex items-center ui-text">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backText}
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {post.linkedin_pick_week && (
                <Badge className="bg-primary text-primary-foreground gap-1.5 rounded-full px-3 py-1 font-sans text-xs font-semibold">
                  <Award className="h-3.5 w-3.5" aria-hidden />
                  CSI Wednesday LinkedIn Pick ({post.linkedin_pick_week})
                </Badge>
              )}
              {isCsiPost && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 font-sans text-xs font-semibold"
                >
                  {publicationName || "CSI Tech Blog"}
                </Badge>
              )}
            </div>
          </m.div>

          {/* Super Admin / CSI Editor / Author Quick Controls */}
          {(isSuperAdmin || (isCsiPost && isCsiEditor) || isAuthor) && (
            <div className="glass-card border-border/60 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <ShieldCheck className="text-primary h-4 w-4" aria-hidden />
                <span>
                  {isSuperAdmin
                    ? "Super Admin Controls"
                    : isCsiEditor
                      ? "CSI Technical Head Controls"
                      : "Author Controls"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(isAuthor || isSuperAdmin) && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="gap-1.5 rounded-full"
                  >
                    <Link
                      href={
                        isCsiPost
                          ? `/csi/write?edit=${post.id}`
                          : `/write?edit=${post.id}`
                      }
                    >
                      <Edit3 className="h-3.5 w-3.5" aria-hidden />
                      Edit Post
                    </Link>
                  </Button>
                )}

                {isCsiPost && isCsiEditor && post.status === "in_review" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={handleApprovePost}
                    className="gap-1.5 rounded-full"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Approve & Publish
                  </Button>
                )}

                {isCsiPost && isCsiEditor && (
                  <>
                    {post.linkedin_pick_week !== currentWeekKey ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending}
                        onClick={handleSelectWeeklyLinkedin}
                        className="gap-1.5 rounded-full"
                      >
                        <Award className="h-3.5 w-3.5" aria-hidden />
                        Pick for Wednesday LinkedIn ({currentWeekKey})
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopyLinkedinCaption}
                        className="gap-1.5 rounded-full"
                      >
                        {copiedLinkedin ? (
                          <Check
                            className="h-3.5 w-3.5 text-emerald-500"
                            aria-hidden
                          />
                        ) : (
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                        )}
                        Copy LinkedIn Caption
                      </Button>
                    )}
                  </>
                )}

                {isSuperAdmin && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={handleDeletePost}
                    className="gap-1.5 rounded-full border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Delete Post
                  </Button>
                )}
              </div>
            </div>
          )}

          {post.status !== "published" && (
            <Alert className="mb-6 rounded-2xl border-amber-500/40 bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="font-sans text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                {post.status === "in_review"
                  ? "Sunday-to-Wednesday CSI Submission (Open for Peer Interaction)"
                  : "Preview: Draft Post"}
              </AlertTitle>
              <AlertDescription className="mt-1 flex flex-wrap items-center justify-between gap-3 font-sans text-sm text-foreground/90">
                <span>
                  {post.status === "in_review"
                    ? "CSI technical members can read, like, and leave comments on this submission before Wednesday editorial selection."
                    : "This draft is currently private to the author and Super Admin."}
                </span>
                {isCsiEditor && post.status === "in_review" && (
                  <Button size="sm" asChild className="rounded-full">
                    <Link href="/csi/review">
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      Open Review Desk
                    </Link>
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <m.article
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: motionEase }}
            className="mb-10"
          >
            <header className="mb-8">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl mb-6 leading-tight">
                {post.title}
              </h1>

              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <Link
                  href={`/profile/${post.author.username}`}
                  className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                    <AvatarImage src={post.author.avatar_url || ""} />
                    <AvatarFallback>
                      {post.author.full_name?.[0] || post.author.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold ui-text">
                        {post.author.full_name || post.author.username}
                      </p>
                      {isCsiPost && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0 h-5 font-sans"
                        >
                          {authorRole === "editor"
                            ? "CSI Editor"
                            : "CSI Member"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground ui-text mt-0.5">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(publishedOrCreatedDate)}</span>
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
                    aria-label={isLiked ? "Unlike post" : "Like post"}
                    className={`flex items-center space-x-2 ${
                      isLiked
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:border-primary/40 hover:bg-primary/10"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                    />
                    <span className="font-semibold">{likesCount}</span>
                  </Button>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("twitter")}
                      aria-label="Share on X (Twitter)"
                      className="hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-500 transition-all duration-300"
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("whatsapp")}
                      aria-label="Share on WhatsApp"
                      className="hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-500 transition-all duration-300"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("copy")}
                      aria-label="Copy link"
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
                      {toTitleCase(tag)}
                    </Badge>
                  ))}
                </div>
              )}

              {post.cover_image && (
                <div className="aspect-video rounded-2xl overflow-hidden mb-8 relative bg-muted/30 border border-border/50">
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 960px"
                    priority
                  />
                </div>
              )}
            </header>

            {showToc && (
              <nav
                aria-label="Table of contents"
                className="mb-10 rounded-2xl border border-border/60 bg-muted/25 p-5 font-sans glass"
              >
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/80">
                  <ListTree className="h-4 w-4 text-primary" />
                  <span>On this page</span>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {headings.map((item) => (
                    <li
                      key={item.id}
                      className={item.level === 3 ? "pl-4" : ""}
                    >
                      <a
                        href={`#${item.id}`}
                        className="inline-block text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <PostBodyRenderer
              content={post.content}
              forceMarkdown={isCsiPost}
            />

            {/* Author Card */}
            <Card className="mt-12 rounded-2xl border border-border/70 glass">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 shrink-0 ring-2 ring-primary/15">
                    <AvatarImage src={post.author.avatar_url || ""} />
                    <AvatarFallback className="text-lg font-semibold">
                      {post.author.full_name?.[0] || post.author.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-semibold text-foreground">
                        {post.author.full_name || post.author.username}
                      </p>
                      <span className="font-sans text-xs text-muted-foreground">
                        @{post.author.username}
                      </span>
                      {isCsiPost && (
                        <Badge variant="secondary" className="text-[11px]">
                          {authorRole === "editor"
                            ? "CSI Editor"
                            : "CSI Technical Member"}
                        </Badge>
                      )}
                    </div>
                    <p className="font-sans text-sm text-muted-foreground line-clamp-2">
                      {post.author.bio ||
                        (isCsiPost
                          ? "Technical writer at CSI MIT-WPU sharing engineering tutorials and deep-dives."
                          : "Writer on The Fourth Clover.")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="shrink-0 rounded-full"
                >
                  <Link href={`/profile/${post.author.username}`}>
                    View Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </m.article>

          {/* More from CSI */}
          {isCsiPost && relatedPosts.length > 0 && (
            <section
              aria-labelledby="more-from-csi-heading"
              className="mb-12 border-t border-border/60 pt-10"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2
                    id="more-from-csi-heading"
                    className="font-display text-2xl font-semibold tracking-tight text-foreground"
                  >
                    More from {publicationName || "CSI"}
                  </h2>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/csi">View all articles</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/csi/${related.slug}`}
                    className="block group"
                  >
                    <Card className="h-full overflow-hidden glass border-2 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
                      {related.cover_image && (
                        <div className="aspect-video relative overflow-hidden bg-muted/30">
                          <Image
                            src={related.cover_image}
                            alt={related.title}
                            width={480}
                            height={270}
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <CardContent className="p-5 flex flex-col justify-between">
                        <div>
                          <h3 className="font-display text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {related.title}
                          </h3>
                          {related.excerpt && (
                            <p className="mt-2 font-sans text-xs text-muted-foreground line-clamp-2">
                              {related.excerpt}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 font-sans text-xs text-muted-foreground">
                          <span className="truncate">
                            {related.author.full_name ||
                              `@${related.author.username}`}
                          </span>
                          <span className="shrink-0">
                            {related.read_time}m read ·{" "}
                            {related.published_at
                              ? formatRelativeTime(related.published_at)
                              : ""}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <CommentSection postId={post.id} />
        </PageShell>
      </LazyMotion>
    </div>
  );
}
