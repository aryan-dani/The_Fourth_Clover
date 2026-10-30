"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArticleCard,
  ArticleLayout,
  BookmarkButton,
  ReactionBar,
  SectionLabel,
  ShareMenu,
  TagChip,
} from "@/components/editorial";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { logSupabaseError } from "@/lib/errors";
import {
  formatLinkedinRepostCopy,
  getCurrentWeekKey,
} from "@/lib/utils";
import {
  approvePublicationPostAction,
  selectWeeklyLinkedinPickAction,
  superAdminDeletePostAction,
} from "@/features/data/server-actions";
import { toast } from "sonner";
import {
  Heart,
  Clock,
  ArrowLeft,
  Edit3,
  ShieldCheck,
  Award,
  CheckCircle2,
  Trash2,
  Loader2,
  Check,
  Copy,
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

  const postFormat = post.format === "poetry" ? "poetry" : "prose";

  const checkIfLiked = useCallback(async (postId: string, userId: string) => {
    try {
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
      toast.success("Post approved and published!");
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
      ? `${origin}/tech-weekly/${post.slug}`
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
      router.push(isCsiPost ? "/tech-weekly" : "/journal");
      router.refresh();
    });
  };

  const backHref = isCsiPost ? "/tech-weekly" : "/journal";
  const backText = isCsiPost
    ? `Back to ${publicationName || "Tech Weekly"}`
    : "Back to Journal";
  const publishedOrCreatedDate = post.published_at || post.created_at;
  const sectionLabel = isCsiPost
    ? "Tech Weekly"
    : postFormat === "poetry"
      ? "Poetry"
      : "Journal";
  return (
    <div className="mx-auto w-full max-w-article px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild size="sm" className="-ml-2">
          <Link href={backHref} className="inline-flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backText}
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {post.linkedin_pick_week && (
            <Badge className="gap-1.5 border-hairline bg-foreground text-background">
              <Award className="h-3.5 w-3.5" aria-hidden />
              LinkedIn Pick ({post.linkedin_pick_week})
            </Badge>
          )}
          {isCsiPost && (
            <span className="meta-label">{publicationName || "CSI"}</span>
          )}
        </div>
      </div>

      {(isSuperAdmin || (isCsiPost && isCsiEditor) || isAuthor) && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border border-hairline px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />
            <span className="meta-label">
              {isSuperAdmin
                ? "Super Admin"
                : isCsiEditor
                  ? "CSI Editor"
                  : "Author"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(isAuthor || isSuperAdmin) && (
              <Button size="sm" variant="outline" asChild className="border-hairline">
                <Link
                  href={
                    isCsiPost
                      ? `/tech-weekly/write?id=${post.id}`
                      : `/write?edit=${post.id}`
                  }
                >
                  <Edit3 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Edit
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
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
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
                  >
                    <Award className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Pick for LinkedIn ({currentWeekKey})
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLinkedinCaption}
                    className="border-hairline"
                  >
                    {copiedLinkedin ? (
                      <Check className="mr-1.5 h-3.5 w-3.5 text-brand" aria-hidden />
                    ) : (
                      <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
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
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {post.status !== "published" && (
        <Alert className="mb-8 border-hairline border-amber-500/40 bg-amber-500/5">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="meta-label text-amber-700 dark:text-amber-300">
            {post.status === "in_review"
              ? "In review — open for peer interaction"
              : "Draft preview"}
          </AlertTitle>
          <AlertDescription className="mt-1 flex flex-wrap items-center justify-between gap-3 font-serif text-sm">
            <span>
              {post.status === "in_review"
                ? "Verified members can read, like, and comment before editorial selection."
                : "This draft is private to the author and Super Admin."}
            </span>
            {isCsiEditor && post.status === "in_review" && (
              <Button size="sm" asChild>
                <Link href="/tech-weekly/review">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Review desk
                </Link>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <ArticleLayout
        sectionLabel={sectionLabel}
        sectionHref={isCsiPost ? "/tech-weekly" : "/journal"}
        title={post.title}
        dek={post.excerpt}
        author={{
          username: post.author.username,
          fullName: post.author.full_name,
          avatarUrl: post.author.avatar_url,
          dept: post.author.dept,
          year: post.author.year,
          isCsi: isCsiPost,
        }}
        publishedAt={publishedOrCreatedDate}
        readTime={post.read_time}
        coverImage={post.cover_image || post.featured_image}
        headings={showToc ? headings : undefined}
        showProgress
        actions={
          <div className="flex flex-wrap items-center gap-1">
            <BookmarkButton targetType="post" targetId={post.id} />
            <ShareMenu title={post.title} />
          </div>
        }
        reactions={
          <div className="space-y-4">
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            )}
            <ReactionBar
              items={[
                {
                  key: "like",
                  label: "Like",
                  icon: (
                    <Heart
                      className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`}
                      aria-hidden
                    />
                  ),
                  count: likesCount,
                  active: isLiked,
                  onClick: () => void toggleLike(),
                },
              ]}
            />
            {isCsiPost && authorRole && (
              <p className="meta-label text-muted-foreground">
                {authorRole === "editor" ? "CSI Editor" : "CSI Member"}
              </p>
            )}
          </div>
        }
        comments={<CommentSection postId={post.id} />}
        related={
          isCsiPost && relatedPosts.length > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <SectionLabel>More from {publicationName || "CSI"}</SectionLabel>
                  <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                    Related reading
                  </h2>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/tech-weekly">View all</Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {relatedPosts.map((related) => (
                  <ArticleCard
                    key={related.id}
                    section="journal"
                    variant="compact"
                    title={related.title}
                    slug={related.slug}
                    excerpt={related.excerpt}
                    author={related.author}
                    publishedAt={related.published_at}
                    readTime={related.read_time}
                  />
                ))}
              </div>
            </div>
          ) : undefined
        }
      >
        <PostBodyRenderer
          content={post.content}
          forceMarkdown={isCsiPost}
          format={postFormat}
        />
      </ArticleLayout>
    </div>
  );
}
