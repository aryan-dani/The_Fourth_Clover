"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/auth-context";
import { formatRelativeTime } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
} from "lucide-react";
import Link from "next/link";
import { Post } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { updatePost, deletePost } from "@/features/data/database-operations";
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
    <Card className="glass rounded-3xl border border-border/60">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardClient({
  serverSnapshot,
}: {
  serverSnapshot: {
    posts: DashboardPostRow[];
    stats: DashboardStatsSnapshot;
  };
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [posts, setPosts] = useState<DashboardPostRow[]>(serverSnapshot.posts);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStatsSnapshot>(serverSnapshot.stats);

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
          comments (count)
        `
          )
          .eq("author_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const userPosts = (data as DashboardPostRow[]) || [];
        setPosts(userPosts);

        const totalLikes = userPosts.reduce(
          (sum, post) => sum + (post.likes?.[0]?.count || 0),
          0
        );
        const totalComments = userPosts.reduce(
          (sum, post) => sum + (post.comments?.[0]?.count || 0),
          0
        );
        const publishedPosts = userPosts.filter(
          (post) => post.status === "published"
        ).length;

        setStats({
          totalPosts: userPosts.length,
          publishedPosts,
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
    [userId]
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

  const handlePublish = async (post: Post) => {
    if (post.status === "published") {
      await updatePost(post.id, { status: "draft", published_at: null });
      toast.success("Post unpublished and moved to drafts.");
    } else {
      await updatePost(post.id, {
        status: "published",
        published_at: new Date().toISOString(),
      });
      toast.success("Post published successfully!");
    }
    fetchPosts(false);
  };

  const published = posts.filter((post) => post.status === "published");
  const drafts = posts.filter(
    (post) => post.status === "draft" && !post.scheduled_at
  );
  const scheduled = posts.filter(
    (post) => post.status === "draft" && post.scheduled_at
  );

  const columns: ColumnDef<DashboardPostRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }: { row: Row<DashboardPostRow> }) => {
        const post = row.original;
        const href =
          post.status === "published"
            ? `/post/${post.slug}`
            : `/write?edit=${post.id}`;

        return (
          <Link
            href={href}
            className="font-medium text-primary hover:underline"
          >
            {post.title}
          </Link>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: Row<DashboardPostRow> }) => {
        const post = row.original;
        return (
          <Badge
            variant={post.status === "published" ? "default" : "secondary"}
          >
            {post.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }: { row: Row<DashboardPostRow> }) => {
        const post = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(post.created_at)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<DashboardPostRow> }) => {
        const post = row.original;
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
              <DropdownMenuItem>
                <Link href={`/write?edit=${post.id}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePublish(post)}>
                {post.status === "published" ? "Unpublish" : "Publish"}
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
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-20 pb-8">
          <WriterHubShell>
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-muted rounded-2xl max-w-md ml-auto" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 bg-muted rounded-3xl" />
                ))}
              </div>
              <div className="h-96 bg-muted rounded-3xl" />
            </div>
          </WriterHubShell>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-20 pb-8">
        <WriterHubShell>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Your writing
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Manage drafts, publishing, and how readers see your work.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0 rounded-2xl shadow-md">
              <Link href="/write">
                <PenTool className="mr-2 h-5 w-5" />
                New post
              </Link>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            <StatCard
              title="Total Posts"
              value={stats.totalPosts}
              icon={FileText}
            />
            <StatCard
              title="Published"
              value={stats.publishedPosts}
              icon={Eye}
            />
            <StatCard
              title="Total Likes"
              value={stats.totalLikes}
              icon={Heart}
            />
            <StatCard
              title="Comments"
              value={stats.totalComments}
              icon={MessageCircle}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-3xl border border-border/70 shadow-lg glass overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-muted/50 p-1 h-auto sm:grid-cols-4">
                    <TabsTrigger value="all" className="rounded-xl">
                      All ({posts.length})
                    </TabsTrigger>
                    <TabsTrigger value="published" className="rounded-xl">
                      Published ({published.length})
                    </TabsTrigger>
                    <TabsTrigger value="drafts" className="rounded-xl">
                      Drafts ({drafts.length})
                    </TabsTrigger>
                    <TabsTrigger value="scheduled" className="rounded-xl gap-1">
                      <Clock className="w-3 h-3" />
                      Scheduled ({scheduled.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-6">
                    <DataTable columns={columns} data={posts} />
                  </TabsContent>
                  <TabsContent value="published" className="mt-6">
                    <DataTable columns={columns} data={published} />
                  </TabsContent>
                  <TabsContent value="drafts" className="mt-6">
                    <DataTable columns={columns} data={drafts} />
                  </TabsContent>
                  <TabsContent value="scheduled" className="mt-6">
                    {scheduled.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          No scheduled posts
                        </h3>
                        <p className="text-muted-foreground mb-4 text-sm max-w-md mx-auto">
                          Schedule posts to be published at a specific date and time.
                        </p>
                        <Button asChild className="rounded-2xl">
                          <Link href="/write">Schedule a post</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {scheduled.map((post) => (
                          <Card key={post.id} className="rounded-2xl glass">
                            <CardContent className="p-4">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={`/write?edit=${post.id}`}
                                    className="font-medium hover:text-primary transition-colors"
                                  >
                                    {post.title}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span>
                                      Scheduled for{" "}
                                      {new Date(
                                        post.scheduled_at!
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className="rounded-lg">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatRelativeTime(post.scheduled_at!)}
                                  </Badge>
                                  <Button variant="outline" size="sm" className="rounded-xl" asChild>
                                    <Link href={`/write?edit=${post.id}`}>
                                      <Edit3 className="w-3 h-3 mr-1" />
                                      Edit
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-destructive hover:text-destructive rounded-xl"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </WriterHubShell>
      </main>

      <Footer />
    </div>
  );
}
