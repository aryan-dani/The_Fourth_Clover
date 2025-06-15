'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { formatRelativeTime } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { toast } from 'sonner';
import { 
  PenTool, 
  Eye, 
  Heart, 
  MessageCircle, 
  MoreVertical,
  Edit3,
  Trash2,
  Calendar,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'draft' | 'published';
  created_at: string;
  published_at: string | null;
  read_time: number;
  tags: string[];
  likes: { count: number }[];
  comments: { count: number }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchUserPosts();
  }, [user, router]);

  const fetchUserPosts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          likes (count),
          comments (count)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts(data || []);
      
      // Calculate stats
      const totalLikes = data?.reduce((sum, post) => sum + (post.likes?.[0]?.count || 0), 0) || 0;
      const totalComments = data?.reduce((sum, post) => sum + (post.comments?.[0]?.count || 0), 0) || 0;
      const publishedPosts = data?.filter(post => post.status === 'published').length || 0;

      setStats({
        totalPosts: data?.length || 0,
        publishedPosts,
        totalLikes,
        totalComments,
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post deleted successfully');
      fetchUserPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const publishPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post published successfully');
      fetchUserPosts();
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Failed to publish post');
    }
  };

  const drafts = posts.filter(post => post.status === 'draft');
  const published = posts.filter(post => post.status === 'published');

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
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
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your posts and track your writing progress
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
          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold">{stats.publishedPosts}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                  <p className="text-2xl font-bold">{stats.totalLikes}</p>
                </div>
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <p className="text-2xl font-bold">{stats.totalComments}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Posts Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all">All Posts ({posts.length})</TabsTrigger>
              <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
              <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <PostsList posts={posts} onDelete={deletePost} onPublish={publishPost} />
            </TabsContent>

            <TabsContent value="published">
              <PostsList posts={published} onDelete={deletePost} onPublish={publishPost} />
            </TabsContent>

            <TabsContent value="drafts">
              <PostsList posts={drafts} onDelete={deletePost} onPublish={publishPost} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

function PostsList({ 
  posts, 
  onDelete, 
  onPublish 
}: { 
  posts: Post[]; 
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground mb-4">
          Start writing your first post to share your thoughts with the world.
        </p>
        <Button asChild>
          <Link href="/write">
            <PenTool className="w-4 h-4 mr-2" />
            Write Your First Post
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="glass hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                      {post.status}
                    </Badge>
                    {post.status === 'published' && (
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes?.[0]?.count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments?.[0]?.count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{post.read_time}m read</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                    {post.status === 'published' ? (
                      <Link href={`/post/${post.slug}`}>
                        {post.title}
                      </Link>
                    ) : (
                      post.title
                    )}
                  </h3>

                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {post.status === 'published' && post.published_at
                          ? `Published ${formatRelativeTime(post.published_at)}`
                          : `Created ${formatRelativeTime(post.created_at)}`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {post.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => onPublish(post.id)}
                      className="whitespace-nowrap"
                    >
                      Publish
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/write?edit=${post.id}`}>
                      <Edit3 className="w-4 h-4" />
                    </Link>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDelete(post.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}