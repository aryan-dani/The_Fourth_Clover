"use client";

import { useState, useEffect, useCallback } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/features/auth/auth-context";
import {
  isUserAdmin,
  getAllUsers,
  getAllPostsAdmin,
  deletePost,
} from "@/features/data/database-operations";
import {
  upsertPublicationMemberAction,
  removePublicationMemberAction,
} from "@/features/data/server-actions";
import { supabase } from "@/lib/supabase";
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
  CheckCircle,
  XCircle,
  ArrowLeft,
  Terminal,
  UserPlus,
  UserMinus,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import type {
  Profile,
  PostWithAuthor,
  PublicationMemberWithProfile,
  PublicationRole,
} from "@/types/database";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [csiMembers, setCsiMembers] = useState<PublicationMemberWithProfile[]>(
    [],
  );
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [memberUsernameInput, setMemberUsernameInput] = useState("");
  const [memberRoleInput, setMemberRoleInput] =
    useState<PublicationRole>("writer");
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  const loadCsiMembers = useCallback(async () => {
    const { data: pubData } = await supabase
      .from("publications")
      .select("id")
      .eq("slug", "csi")
      .maybeSingle();

    if (!pubData) return;

    const { data: membersData } = await supabase
      .from("publication_members")
      .select(
        `
        publication_id,
        user_id,
        role,
        created_at,
        profile:profiles!publication_members_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          bio
        )
      `,
      )
      .eq("publication_id", pubData.id)
      .order("created_at", { ascending: true });

    if (membersData) {
      setCsiMembers(membersData as unknown as PublicationMemberWithProfile[]);
    }
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const uid = user?.id;
      if (!uid) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const admin = await isUserAdmin(uid);
        setIsAdmin(admin);

        if (admin) {
          const [usersResult, postsResult] = await Promise.all([
            getAllUsers(100),
            getAllPostsAdmin(100),
            loadCsiMembers(),
          ]);

          if (usersResult.data) setUsers(usersResult.data as Profile[]);
          if (postsResult.data) setPosts(postsResult.data as PostWithAuthor[]);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setCheckingAdmin(false);
        setLoadingData(false);
      }
    };

    if (!loading) {
      void checkAdmin();
    }
  }, [user?.id, loading, loadCsiMembers]);

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

  const handleUpsertMember = async (
    usernameOrEmail: string,
    role: PublicationRole,
  ) => {
    if (!usernameOrEmail.trim()) {
      toast.error("Enter a username first.");
      return;
    }

    setMemberActionLoading(true);
    try {
      const result = await upsertPublicationMemberAction(
        "csi",
        usernameOrEmail.trim(),
        role,
      );
      if (!result.ok) {
        toast.error(result.error || "Could not update CSI member.");
        return;
      }
      toast.success(
        `Assigned @${usernameOrEmail.replace(/^@/, "")} as CSI ${role}.`,
      );
      setMemberUsernameInput("");
      await loadCsiMembers();
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string, username: string) => {
    setMemberActionLoading(true);
    try {
      const result = await removePublicationMemberAction("csi", targetUserId);
      if (!result.ok) {
        toast.error(result.error || "Could not remove CSI member.");
        return;
      }
      toast.success(`Removed @${username} from CSI members.`);
      await loadCsiMembers();
    } finally {
      setMemberActionLoading(false);
    }
  };

  const csiMemberByUserId = new Map(
    csiMembers.map((member) => [member.user_id, member]),
  );

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredPosts = posts.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.author?.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading || checkingAdmin) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/auth/signin");
    return null;
  }

  if (!isAdmin) {
    return (
      <LazyMotion features={domAnimation}>
        <div className="bg-background min-h-screen">
          <main className="flex-1 pt-20 pb-8">
            <PageShell
              variant="reading"
              title="Access Denied"
              description="You don't have permission to access the admin panel. This area is restricted to administrators only."
            >
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 text-center"
              >
                <div className="bg-destructive/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                  <Shield className="text-destructive h-10 w-10" />
                </div>
                <Button asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </Button>
              </m.div>
            </PageShell>
          </main>
        </div>
      </LazyMotion>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="bg-background min-h-screen">
        <main className="flex-1 pt-20 pb-8">
          <PageShell
            variant="wide"
            title="Admin Panel"
            description="Manage users, CSI publication members, and content across the platform."
            headerLead={
              <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            }
          >
            {/* Stats Overview */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4"
            >
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{users.length}</p>
                      <p className="text-muted-foreground text-sm">
                        Total Users
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                      <FileText className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {posts.filter((p) => p.status === "published").length}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Published Posts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Terminal className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{csiMembers.length}</p>
                      <p className="text-muted-foreground text-sm">
                        CSI Members
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                      <Shield className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {users.filter((u) => u.is_admin).length}
                      </p>
                      <p className="text-muted-foreground text-sm">Admins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </m.div>

            {/* Search */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="relative max-w-md">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search users or posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </m.div>

            {/* Tabs */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Tabs defaultValue="csi" className="space-y-6">
                <TabsList className="h-12 flex-wrap">
                  <TabsTrigger value="csi" className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    CSI Members ({csiMembers.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Users ({filteredUsers.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="posts"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Posts ({filteredPosts.length})
                  </TabsTrigger>
                </TabsList>

                {/* CSI Members Tab */}
                <TabsContent value="csi">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>CSI MIT-WPU Publication Members</CardTitle>
                      <CardDescription>
                        Assign technical writers and editors (Technical Lead and
                        Technical Secretary) for the `/csi` publication.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void handleUpsertMember(
                            memberUsernameInput,
                            memberRoleInput,
                          );
                        }}
                        className="border-border/60 bg-muted/30 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"
                      >
                        <Input
                          placeholder="Username (e.g. aryan_dani)"
                          value={memberUsernameInput}
                          onChange={(e) =>
                            setMemberUsernameInput(e.target.value)
                          }
                          className="sm:max-w-xs"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              memberRoleInput === "writer"
                                ? "default"
                                : "outline"
                            }
                            onClick={() => setMemberRoleInput("writer")}
                          >
                            Writer
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              memberRoleInput === "editor"
                                ? "default"
                                : "outline"
                            }
                            onClick={() => setMemberRoleInput("editor")}
                          >
                            Editor (Lead / Secretary)
                          </Button>
                        </div>
                        <Button
                          type="submit"
                          disabled={memberActionLoading}
                          className="gap-2 sm:ml-auto"
                        >
                          {memberActionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                          Add / Update Member
                        </Button>
                      </form>

                      {csiMembers.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                          No CSI publication members added yet. Add a writer or
                          editor by username above.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Member</TableHead>
                              <TableHead>Username</TableHead>
                              <TableHead>CSI Role</TableHead>
                              <TableHead>Added</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csiMembers.map((member) => (
                              <TableRow key={member.user_id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={member.profile?.avatar_url || ""}
                                      />
                                      <AvatarFallback>
                                        {member.profile?.full_name?.[0] ||
                                          member.profile?.username?.[0] ||
                                          "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">
                                      {member.profile?.full_name || "Unknown"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  @{member.profile?.username || "user"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      member.role === "editor"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="capitalize"
                                  >
                                    {member.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {formatRelativeTime(member.created_at)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          void handleUpsertMember(
                                            member.profile?.username || "",
                                            member.role === "editor"
                                              ? "writer"
                                              : "editor",
                                          )
                                        }
                                      >
                                        Switch to{" "}
                                        {member.role === "editor"
                                          ? "Writer"
                                          : "Editor"}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() =>
                                          void handleRemoveMember(
                                            member.user_id,
                                            member.profile?.username || "user",
                                          )
                                        }
                                      >
                                        <UserMinus className="mr-2 h-4 w-4" />
                                        Remove from CSI
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

                {/* Users Tab */}
                <TabsContent value="users">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>
                        View and manage all registered users
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingData ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Username</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Joined</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((u) => {
                              const csiMember = csiMemberByUserId.get(u.id);
                              return (
                                <TableRow key={u.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={u.avatar_url || ""}
                                        />
                                        <AvatarFallback>
                                          {u.full_name?.[0] ||
                                            u.username?.[0] ||
                                            "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">
                                          {u.full_name || "Unknown"}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>@{u.username}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1.5">
                                      {u.is_admin ? (
                                        <Badge variant="default">Admin</Badge>
                                      ) : (
                                        <Badge variant="secondary">User</Badge>
                                      )}
                                      {csiMember && (
                                        <Badge
                                          variant="outline"
                                          className="border-primary/40 text-primary capitalize"
                                        >
                                          CSI {csiMember.role}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {formatRelativeTime(u.created_at)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                          <Link href={`/profile/${u.username}`}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Profile
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() =>
                                            void handleUpsertMember(
                                              u.username,
                                              "writer",
                                            )
                                          }
                                        >
                                          Make CSI Writer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            void handleUpsertMember(
                                              u.username,
                                              "editor",
                                            )
                                          }
                                        >
                                          Make CSI Editor
                                        </DropdownMenuItem>
                                        {csiMember && (
                                          <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() =>
                                              void handleRemoveMember(
                                                u.id,
                                                u.username,
                                              )
                                            }
                                          >
                                            Remove from CSI
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
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
                      <CardDescription>
                        View and moderate all posts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingData ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Author</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPosts.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <p className="line-clamp-1 font-medium">
                                      {p.title}
                                    </p>
                                    {p.publication_id && (
                                      <Badge
                                        variant="outline"
                                        className="border-primary/40 text-primary text-[10px]"
                                      >
                                        CSI
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={p.author?.avatar_url || ""}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {p.author?.full_name?.[0] || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      @{p.author?.username}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {p.status === "published" ? (
                                    <Badge
                                      variant="default"
                                      className="bg-green-500"
                                    >
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Published
                                    </Badge>
                                  ) : p.status === "in_review" ? (
                                    <Badge
                                      variant="outline"
                                      className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                                    >
                                      <Clock className="mr-1 h-3 w-3" />
                                      In Review
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      <XCircle className="mr-1 h-3 w-3" />
                                      Draft
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatRelativeTime(p.created_at)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={
                                            p.publication_id
                                              ? `/csi/${p.slug}`
                                              : `/post/${p.slug}`
                                          }
                                        >
                                          <Eye className="mr-2 h-4 w-4" />
                                          View Post
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeletePost(p.id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
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
            </m.div>
          </PageShell>
        </main>
      </div>
    </LazyMotion>
  );
}
