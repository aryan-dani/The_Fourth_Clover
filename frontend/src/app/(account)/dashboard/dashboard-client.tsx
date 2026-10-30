"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/auth-context";
import { RelativeTime } from "@/components/time/RelativeTime";
import { WriterHubShell } from "@/components/layout/WriterHubShell";
import { toast } from "sonner";
import {
  Edit3,
  Trash2,
  Calendar,
  Clock,
  MoreHorizontal,
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
import { cn } from "@/lib/utils";

function StatFigure({
  title,
  value,
  className,
}: {
  title: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 px-4 py-4 sm:px-5", className)}>
      <p className="type-display text-[clamp(1.75rem,4vw,2.35rem)] tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="type-label mt-2 text-muted-foreground">{title}</p>
    </div>
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
        <div className="animate-pulse space-y-8">
          <div className="space-y-3">
            <div className="bg-muted h-3 w-20" />
            <div className="bg-muted h-10 w-56" />
            <div className="bg-muted h-4 max-w-md" />
          </div>
          <div className="grid grid-cols-2 gap-px bg-[var(--fg-line)] xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-background h-24" />
            ))}
          </div>
          <div className="bg-muted h-80 border border-[var(--fg-line)]" />
        </div>
      </WriterHubShell>
    );
  }

  const tabTriggerClass =
    "btn-chip !h-auto !rounded-[var(--radius)] data-[state=active]:!bg-transparent data-[state=active]:border-[var(--fg)] data-[state=active]:text-[var(--bg)]";

  return (
    <WriterHubShell>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <p className="type-label text-muted-foreground">Studio</p>
          <h1 className="type-display mt-2 text-[clamp(2rem,5vw,3rem)]">
            Your writing
          </h1>
          <p className="type-body mt-3 text-sm md:text-base">
            Manage drafts, CSI submissions, publishing, and how readers see your
            work.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {csiRole === "editor" && (
            <Link href="/csi/review" className="btn-chip">
              CSI Review Queue
            </Link>
          )}
          {csiRole && (
            <Link href="/csi/write" className="btn-chip">
              Write for CSI
            </Link>
          )}
          <Link href="/write" className="btn-editorial btn-editorial--solid">
            New post
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 border border-[var(--fg-line)] xl:grid-cols-4">
        <StatFigure
          title="Total posts"
          value={stats.totalPosts}
          className="border-b border-r border-[var(--fg-line)] xl:border-b-0"
        />
        <StatFigure
          title="Published"
          value={stats.publishedPosts}
          className="border-b border-[var(--fg-line)] xl:border-b-0 xl:border-r"
        />
        <StatFigure
          title="Total likes"
          value={stats.totalLikes}
          className="border-r border-[var(--fg-line)]"
        />
        <StatFigure title="Comments" value={stats.totalComments} />
      </div>

      <section className="border border-[var(--fg-line)] p-4 sm:p-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-none border-0 bg-transparent p-0">
            <TabsTrigger value="all" className={tabTriggerClass}>
              All ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="published" className={tabTriggerClass}>
              Published ({published.length})
            </TabsTrigger>
            <TabsTrigger value="in_review" className={tabTriggerClass}>
              In Review ({inReview.length})
            </TabsTrigger>
            <TabsTrigger value="drafts" className={tabTriggerClass}>
              Drafts ({drafts.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled" className={tabTriggerClass}>
              Scheduled ({scheduled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-5">
            <DataTable columns={columns} data={posts} />
          </TabsContent>
          <TabsContent value="published" className="mt-5">
            <DataTable columns={columns} data={published} />
          </TabsContent>
          <TabsContent value="in_review" className="mt-5">
            <DataTable columns={columns} data={inReview} />
          </TabsContent>
          <TabsContent value="drafts" className="mt-5">
            <DataTable columns={columns} data={drafts} />
          </TabsContent>
          <TabsContent value="scheduled" className="mt-5">
            {scheduled.length === 0 ? (
              <div className="border border-dashed border-[var(--fg-line)] px-6 py-12 text-center">
                <p className="type-label text-muted-foreground">Scheduled</p>
                <h3 className="type-display mt-3 text-xl">No scheduled posts</h3>
                <p className="type-body mx-auto mt-3 max-w-md text-sm">
                  Schedule posts to publish at a specific date and time.
                </p>
                <Link
                  href="/write"
                  className="btn-editorial btn-editorial--solid mt-6 inline-flex"
                >
                  Schedule a post
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--fg-line)] border border-[var(--fg-line)]">
                {scheduled.map((post) => {
                  const isCsi = Boolean(
                    post.publication_id || post.publication?.slug === "csi",
                  );
                  const editHref = `/write?edit=${post.id}`;
                  return (
                    <li
                      key={post.id}
                      className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={editHref}
                            className="font-medium transition-opacity hover:opacity-70"
                          >
                            {post.title}
                          </Link>
                          {isCsi && (
                            <Badge
                              variant="outline"
                              className="rounded-none border-[var(--fg-line)] px-2 py-0 text-[10px] uppercase"
                            >
                              CSI
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>
                            Scheduled for{" "}
                            {new Date(post.scheduled_at!).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="rounded-none gap-1"
                        >
                          <Calendar className="h-3 w-3" />
                          <RelativeTime date={post.scheduled_at!} />
                        </Badge>
                        <Link href={editHref} className="btn-chip gap-1">
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="btn-chip text-destructive"
                          aria-label={`Delete ${post.title}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </WriterHubShell>
  );
}
