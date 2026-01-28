"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import { isUserAdmin, getAllUsers, getAllPostsAdmin, deletePost } from "@/lib/database-operations";
import { toast } from "sonner";
import {
    Users,
    FileText,
    Shield,
    Loader2,
    MoreHorizontal,
    Eye,
    Trash2,
    Search,
    UserX,
    CheckCircle,
    XCircle,
    ArrowLeft,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

export default function AdminPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAdmin, setCheckingAdmin] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Check if user is admin
    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                setCheckingAdmin(false);
                return;
            }

            try {
                const admin = await isUserAdmin(user.id);
                setIsAdmin(admin);

                if (admin) {
                    // Fetch admin data
                    const [usersResult, postsResult] = await Promise.all([
                        getAllUsers(100),
                        getAllPostsAdmin(100),
                    ]);

                    if (usersResult.data) setUsers(usersResult.data);
                    if (postsResult.data) setPosts(postsResult.data);
                }
            } catch (error) {
                console.error("Error checking admin status:", error);
            } finally {
                setCheckingAdmin(false);
                setLoadingData(false);
            }
        };

        if (!loading) {
            checkAdmin();
        }
    }, [user, loading]);

    const handleDeletePost = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            await deletePost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            toast.success("Post deleted successfully");
        } catch (error) {
            toast.error("Failed to delete post");
            console.error(error);
        }
    };

    const filteredUsers = users.filter(
        (u) =>
            u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPosts = posts.filter(
        (p) =>
            p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.author?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading || checkingAdmin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        router.push("/auth/signin");
        return null;
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 py-12 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-10 h-10 text-destructive" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            You don't have permission to access the admin panel. This area is restricted to administrators only.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </motion.div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <h1 className="text-4xl font-bold">Admin Panel</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage users and content across the platform
                    </p>
                </motion.div>

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
                >
                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{users.length}</p>
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{posts.filter(p => p.status === "published").length}</p>
                                    <p className="text-sm text-muted-foreground">Published Posts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{posts.filter(p => p.status === "draft").length}</p>
                                    <p className="text-sm text-muted-foreground">Draft Posts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{users.filter(u => u.is_admin).length}</p>
                                    <p className="text-sm text-muted-foreground">Admins</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users or posts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Tabs defaultValue="users" className="space-y-6">
                        <TabsList className="h-12">
                            <TabsTrigger value="users" className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Users ({filteredUsers.length})
                            </TabsTrigger>
                            <TabsTrigger value="posts" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Posts ({filteredPosts.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Users Tab */}
                        <TabsContent value="users">
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle>User Management</CardTitle>
                                    <CardDescription>View and manage all registered users</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingData ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Username</TableHead>
                                                    <TableHead>Role</TableHead>
                                                    <TableHead>Joined</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredUsers.map((u) => (
                                                    <TableRow key={u.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={u.avatar_url || ""} />
                                                                    <AvatarFallback>
                                                                        {u.full_name?.[0] || u.username?.[0] || "U"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">{u.full_name || "Unknown"}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>@{u.username}</TableCell>
                                                        <TableCell>
                                                            {u.is_admin ? (
                                                                <Badge variant="default">Admin</Badge>
                                                            ) : (
                                                                <Badge variant="secondary">User</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{formatRelativeTime(u.created_at)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/profile/${u.username}`}>
                                                                            <Eye className="w-4 h-4 mr-2" />
                                                                            View Profile
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Posts Tab */}
                        <TabsContent value="posts">
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle>Content Management</CardTitle>
                                    <CardDescription>View and moderate all posts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingData ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Title</TableHead>
                                                    <TableHead>Author</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Created</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredPosts.map((p) => (
                                                    <TableRow key={p.id}>
                                                        <TableCell>
                                                            <p className="font-medium line-clamp-1">{p.title}</p>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={p.author?.avatar_url || ""} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {p.author?.full_name?.[0] || "U"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-sm">@{p.author?.username}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {p.status === "published" ? (
                                                                <Badge variant="default" className="bg-green-500">
                                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                                    Published
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary">
                                                                    <XCircle className="w-3 h-3 mr-1" />
                                                                    Draft
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{formatRelativeTime(p.created_at)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/post/${p.slug}`}>
                                                                            <Eye className="w-4 h-4 mr-2" />
                                                                            View Post
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeletePost(p.id)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                        Delete Post
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
