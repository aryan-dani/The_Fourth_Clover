"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
import { useMutatePost } from "@/hooks/useMutatePost";
import { Post } from "@/lib/database-types";
import { supabase } from "@/lib/supabase";
import {
  getUserPosts,
  updatePost,
  deletePost,
} from "@/lib/database-operations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "../../components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

// Extend Post type to include nested counts which may not be on the base type
interface DashboardPost extends Post {
  likes: { count: number }[];
  comments: { count: number }[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = "text-primary",
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <Card className="glass">
      <CardContent className="p-6">
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("published");
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  const fetchPosts = async (showLoading = true) => {
    if (!user) return;

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
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userPosts = (data as DashboardPost[]) || [];
      setPosts(userPosts);

      // Calculate stats
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
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    fetchPosts();
  }, [user, authLoading]);

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await deletePost(id);
      if (error) throw error;
      toast.success("Post deleted successfully.");
      fetchPosts(false); // Refresh without full loading state
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handlePublish = async (post: Post) => {
    if (post.status === "published") {
      // Unpublish
      await updatePost(post.id, { status: "draft", published_at: null });
      toast.success("Post unpublished and moved to drafts.");
    } else {
      // Publish
      await updatePost(post.id, {
        status: "published",
        published_at: new Date().toISOString(),
      });
      toast.success("Post published successfully!");
    }
    // Refresh posts
    fetchPosts(false);
  };

  const published = posts.filter((post) => post.status === "published");
  const drafts = posts.filter((post) => post.status === "draft" && !post.scheduled_at);
  const scheduled = posts.filter((post) => post.status === "draft" && post.scheduled_at);

  const columns: ColumnDef<DashboardPost>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }: { row: any }) => {
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
      cell: ({ row }: { row: any }) => {
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
      cell: ({ row }: { row: any }) => {
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
      cell: ({ row }: { row: any }) => {
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-muted rounded-lg"></div>
              ))}
            </div>
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2 brand-text">Dashboard</h1>
            <p className="text-muted-foreground ui-text">
              Manage your posts and track your writing progress.
            </p>
          </div>
          <Button asChild size="lg" className="animate-glow">
            <Link href="/write">
              <PenTool className="w-5 h-5 mr-2" />
              Write New Post
            </Link>
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
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
            color="text-green-500"
          />
          <StatCard
            title="Total Likes"
            value={stats.totalLikes}
            icon={Heart}
            color="text-red-500"
          />
          <StatCard
            title="Comments"
            value={stats.totalComments}
            icon={MessageCircle}
            color="text-blue-500"
          />
        </motion.div>

        {/* Posts Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="all">All Posts ({posts.length})</TabsTrigger>
              <TabsTrigger value="published">
                Published ({published.length})
              </TabsTrigger>
              <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
              <TabsTrigger value="scheduled">
                <Clock className="w-3 h-3 mr-1" />
                Scheduled ({scheduled.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DataTable columns={columns} data={posts} />
            </TabsContent>
            <TabsContent value="published">
              <DataTable columns={columns} data={published} />
            </TabsContent>
            <TabsContent value="drafts">
              <DataTable columns={columns} data={drafts} />
            </TabsContent>
            <TabsContent value="scheduled">
              {scheduled.length === 0 ? (
                <Card className="glass">
                  <CardContent className="p-12 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No scheduled posts</h3>
                    <p className="text-muted-foreground mb-4">
                      Schedule posts to be published at a specific date and time.
                    </p>
                    <Button asChild>
                      <Link href="/write">Schedule a Post</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {scheduled.map((post) => (
                    <Card key={post.id} className="glass">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Link
                              href={`/write?edit=${post.id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {post.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                Scheduled for {new Date(post.scheduled_at!).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatRelativeTime(post.scheduled_at!)}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link href={`/write?edit=${post.id}`}>
                                <Edit3 className="w-3 h-3 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePost(post.id)}
                              className="text-destructive hover:text-destructive"
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
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
