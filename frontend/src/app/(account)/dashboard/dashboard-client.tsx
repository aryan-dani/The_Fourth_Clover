"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/auth-context";
import { RelativeTime } from "@/components/time/RelativeTime";
import { WriterHubShell } from "@/components/layout/WriterHubShell";
import { toast } from "sonner";
import {
  PenTool,
  Eye,
  Heart,
  MessageCircle,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  FileText,
  MoreHorizontal,
  Send,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { Post, PublicationRole } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { updatePost, deletePost } from "@/features/data/database-operations";
import { notifyEditorsOfReviewSubmissionAction } from "@/features/data/server-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef, Row } from "@tanstack/react-table";
import type {
  DashboardPostRow,
  DashboardStatsSnapshot,
} from "@/features/data/server-queries";

function StatCard({
  title,
  value,
  icon: Icon,
  color = "text-muted-foreground",
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <Card className="glass border-border/60 rounded-3xl border">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: Post["status"]) {
  if (status === "published") {
    return <Badge variant="default">Published</Badge>;
  }
  if (status === "in_review") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300"
      >
        In Review
      </Badge>
    );
  }
  return <Badge variant="secondary">Draft</Badge>;
}

export function DashboardClient({
  serverSnapshot,
}: {
  serverSnapshot: {
    posts: DashboardPostRow[];
    stats: DashboardStatsSnapshot;
    csiRole?: PublicationRole | null;
  };
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [posts, setPosts] = useState<DashboardPostRow[]>(serverSnapshot.posts);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStatsSnapshot>(
    serverSnapshot.stats,
  );
  const csiRole = serverSnapshot.csiRole ?? null;

  useEffect(() => {
    setPosts(serverSnapshot.posts);
    setStats(serverSnapshot.stats);
  }, [serverSnapshot.posts, serverSnapshot.stats]);

  const fetchPosts = useCallback(
    async (showLoading = true) => {
      if (!userId) return;

      if (showLoading) setLoading(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(
            `
          *,
          likes (count),
          comments (count),
          publication:publications (id, slug, name)
        `,
          )
          .eq("author_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const userPosts = (data as DashboardPostRow[]) || [];
        setPosts(userPosts);

        const totalLikes = userPosts.reduce(
          (sum, post) => sum + (post.likes?.[0]?.count || 0),
          0,
        );
        const totalComments = userPosts.reduce(
          (sum, post) => sum + (post.comments?.[0]?.count || 0),
          0,
        );
        const publishedPosts = userPosts.filter(
          (post) => post.status === "published",
        ).length;
        const inReviewPosts = userPosts.filter(
          (post) => post.status === "in_review",
        ).length;

        setStats({
          totalPosts: userPosts.length,
          publishedPosts,
          inReviewPosts,
          totalLikes,
          totalComments,
        });
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast.error("Failed to load posts");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push("/auth/signin");
    }
  }, [userId, authLoading, router]);

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await deletePost(id);
      if (error) throw error;
      toast.success("Post deleted successfully.");
      fetchPosts(false);
    } catch (error: unknown) {
      console.error("Error deleting post:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error: ${message}`);
    }
  };

  const handleStatusAction = async (post: DashboardPostRow) => {
    const isCsiPost = Boolean(
      post.publication_id || post.publication?.slug === "csi",
    );
    const isWriterOnly = isCsiPost && csiRole !== "editor";

    try {
      if (post.status === "published" || post.status === "in_review") {
        const { error } = await updatePost(post.id, {
          status: "draft",
          published_at: null,
        });
        if (error) throw error;
        toast.success("Post moved back to drafts.");
      } else if (isWriterOnly) {
        const { error } = await updatePost(post.id, {
          status: "in_review",
          published_at: null,
          review_note: null,
        });
        if (error) throw error;
        await notifyEditorsOfReviewSubmissionAction(post.id, post.title);
        toast.success("Submitted to CSI editors for review!");
      } else {
        const { error } = await updatePost(post.id, {
          status: "published",
          published_at: new Date().toISOString(),
          review_note: null,
        });
        if (error) throw error;
        toast.success("Post published successfully!");
      }
      fetchPosts(false);
    } catch (error: unknown) {
      console.error("Error updating post status:", error);
      const message =
        error instanceof Error ? error.message : "Could not update post";
      toast.error(`Error: ${message}`);
    }
  };

  const published = posts.filter((post) => post.status === "published");
  const inReview = posts.filter((post) => post.status === "in_review");
  const drafts = posts.filter(
    (post) => post.status === "draft" && !post.scheduled_at,
  );
  const scheduled = posts.filter(
    (post) => post.status === "draft" && post.scheduled_at,
  );

  const columns: ColumnDef<DashboardPostRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }: { row: Row<DashboardPostRow> }) => {
        const post = row.original;
        const isCsi = Boolean(
          post.publication_id || post.publication?.slug === "csi",
        );
        // CSI publication journal drafts use the shared journal editor (/write).
        // Tech Weekly pieces are edited at /tech-weekly/write?id=.
        const editHref = `/write?edit=${post.id}`;
        const viewHref = isCsi ? `/csi/${post.slug}` : `/post/${post.slug}`;
        const href =
          post.status === "published" || post.status === "in_review"
            ? viewHref
            : editHref;

        return (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={href}
              className="text-primary font-medium hover:underline"
            >
              {post.title}
            </Link>
            {isCsi && (
              <Badge
                variant="outline"
                className="border-primary/35 bg-primary/10 text-primary rounded-full px-2 py-0 text-[10px] font-semibold uppercase"
              >
                {post.publication?.slug || "CSI"}
              </Badge>
            )}
            {post.status === "draft" && post.review_note && (
              <Badge
                variant="outline"
                className="rounded-full border-amber-500/40 bg-amber-500/10 px-2 py-0 text-[10px] text-amber-600 dark:text-amber-300"
              >
                Feedback available
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: Row<DashboardPostRow> }) => {
        return getStatusBadge(row.original.status);
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }: { row: Row<DashboardPostRow> }) => {
        const post = row.original;
        return (
          <RelativeTime
            date={post.created_at}
            className="text-muted-foreground text-sm"
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<DashboardPostRow> }) => {
        const post = row.original;
        const isCsi = Boolean(
          post.publication_id || post.publication?.slug === "csi",
        );
        const editHref = `/write?edit=${post.id}`;
        const isWriterOnly = isCsi && csiRole !== "editor";

        let statusActionLabel = "Publish";
        if (post.status === "published") {
          statusActionLabel = "Unpublish";
        } else if (post.status === "in_review") {
          statusActionLabel = "Withdraw to Draft";
        } else if (isWriterOnly) {
          statusActionLabel = "Submit for Review";
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(post.id)}
              >
                Copy post ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={editHref}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusAction(post)}>
                {statusActionLabel}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => handleDeletePost(post.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading || authLoading) {
    return (
      <WriterHubShell>
        <div className="animate-pulse space-y-6">
          <div className="bg-muted ml-auto h-10 max-w-md rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted h-28 rounded-3xl" />
            ))}
          </div>
          <div className="bg-muted h-96 rounded-3xl" />
        </div>
      </WriterHubShell>
    );
  }

  return (
    <WriterHubShell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Your Writing
            </h1>
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">
              Manage drafts, CSI submissions, publishing, and how readers see
              your work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {csiRole === "editor" && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="shrink-0 gap-2 rounded-2xl"
              >
                <Link href="/csi/review">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  CSI Review Queue
                </Link>
              </Button>
            )}
            {csiRole && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="shrink-0 gap-2 rounded-2xl"
              >
                <Link href="/csi/write">
                  <Terminal className="h-4 w-4" aria-hidden />
                  Write for CSI
                </Link>
              </Button>
            )}
            <Button asChild size="lg" className="shrink-0 rounded-2xl shadow-md">
              <Link href="/write">
                <PenTool className="mr-2 h-5 w-5" />
                New Post
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Posts"
            value={stats.totalPosts}
            icon={FileText}
          />
          <StatCard title="Published" value={stats.publishedPosts} icon={Eye} />
          <StatCard title="Total Likes" value={stats.totalLikes} icon={Heart} />
          <StatCard
            title="Comments"
            value={stats.totalComments}
            icon={MessageCircle}
          />
        </div>

          <Card className="border-border/70 glass overflow-hidden rounded-3xl border shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-muted/50 grid h-auto w-full grid-cols-2 gap-2 rounded-2xl p-1 sm:grid-cols-5">
                  <TabsTrigger value="all" className="rounded-xl">
                    All ({posts.length})
                  </TabsTrigger>
                  <TabsTrigger value="published" className="rounded-xl">
                    Published ({published.length})
                  </TabsTrigger>
                  <TabsTrigger value="in_review" className="gap-1 rounded-xl">
                    <Send className="h-3 w-3" aria-hidden />
                    In Review ({inReview.length})
                  </TabsTrigger>
                  <TabsTrigger value="drafts" className="rounded-xl">
                    Drafts ({drafts.length})
                  </TabsTrigger>
                  <TabsTrigger value="scheduled" className="gap-1 rounded-xl">
                    <Clock className="h-3 w-3" aria-hidden />
                    Scheduled ({scheduled.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <DataTable columns={columns} data={posts} />
                </TabsContent>
                <TabsContent value="published" className="mt-6">
                  <DataTable columns={columns} data={published} />
                </TabsContent>
                <TabsContent value="in_review" className="mt-6">
                  <DataTable columns={columns} data={inReview} />
                </TabsContent>
                <TabsContent value="drafts" className="mt-6">
                  <DataTable columns={columns} data={drafts} />
                </TabsContent>
                <TabsContent value="scheduled" className="mt-6">
                  {scheduled.length === 0 ? (
                    <div className="border-border/80 rounded-2xl border border-dashed p-12 text-center">
                      <Clock className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                      <h3 className="mb-2 text-lg font-semibold">
                        No scheduled posts
                      </h3>
                      <p className="text-muted-foreground mx-auto mb-4 max-w-md text-sm">
                        Schedule posts to be published at a specific date and
                        time.
                      </p>
                      <Button asChild className="rounded-2xl">
                        <Link href="/write">Schedule a post</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduled.map((post) => {
                        const isCsi = Boolean(
                          post.publication_id ||
                            post.publication?.slug === "csi",
                        );
                        const editHref = `/write?edit=${post.id}`;
                        return (
                          <Card key={post.id} className="glass rounded-2xl">
                            <CardContent className="p-4">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Link
                                      href={editHref}
                                      className="hover:text-primary font-medium transition-colors"
                                    >
                                      {post.title}
                                    </Link>
                                    {isCsi && (
                                      <Badge
                                        variant="outline"
                                        className="border-primary/35 bg-primary/10 text-primary rounded-full px-2 py-0 text-[10px]"
                                      >
                                        CSI
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    <span>
                                      Scheduled for{" "}
                                      {new Date(
                                        post.scheduled_at!,
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="rounded-lg"
                                  >
                                    <Calendar className="mr-1 h-3 w-3" />
                                    <RelativeTime date={post.scheduled_at!} />
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    asChild
                                  >
                                    <Link href={editHref}>
                                      <Edit3 className="mr-1 h-3 w-3" />
                                      Edit
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-destructive hover:text-destructive rounded-xl"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
      </WriterHubShell>
  );
}
