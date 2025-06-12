'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  PenTool, 
  Users, 
  Zap, 
  Heart, 
  ArrowRight, 
  Star,
  TrendingUp,
  MessageCircle,
  Clock
} from 'lucide-react';

const featuredPosts = [
  {
    id: '1',
    title: 'The Art of Minimalist Writing',
    excerpt: 'Exploring how simplicity in prose can create profound impact and connect deeply with readers.',
    author: {
      name: 'Elena Martinez',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      username: 'elenamartinez'
    },
    cover: 'https://images.pexels.com/photos/6765867/pexels-photo-6765867.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=2',
    tags: ['Writing', 'Minimalism', 'Craft'],
    readTime: 6,
    createdAt: '2024-01-15',
    likes: 89,
    comments: 12
  },
  {
    id: '2',
    title: 'Building Digital Mindfulness',
    excerpt: 'How to create intentional digital habits that support creativity and well-being in our connected world.',
    author: {
      name: 'David Chen',
      avatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      username: 'davidchen'
    },
    cover: 'https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=2',
    tags: ['Mindfulness', 'Technology', 'Wellness'],
    readTime: 8,
    createdAt: '2024-01-14',
    likes: 124,
    comments: 18
  },
  {
    id: '3',
    title: 'The Power of Slow Journalism',
    excerpt: 'Why taking time to deeply research and thoughtfully craft stories matters more than ever.',
    author: {
      name: 'Sarah Kim',
      avatar: 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      username: 'sarahkim'
    },
    cover: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=2',
    tags: ['Journalism', 'Media', 'Ethics'],
    readTime: 5,
    createdAt: '2024-01-13',
    likes: 67,
    comments: 9
  }
];

const features = [
  {
    icon: PenTool,
    title: 'Distraction-Free Writing',
    description: 'Clean, minimal editor focused on your words. Auto-save and markdown support included.'
  },
  {
    icon: Users,
    title: 'Thoughtful Community',
    description: 'Connect with readers who value quality content and meaningful conversations.'
  },
  {
    icon: Zap,
    title: 'Fast & Elegant',
    description: 'Lightning-fast performance with a timeless design that never gets in the way.'
  },
  {
    icon: Heart,
    title: 'Built for Writers',
    description: 'Every feature designed with writers in mind, from drafts to publication.'
  }
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="circle-logo mx-auto mb-8 w-20 h-20">
                <span className="text-2xl">🍀</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight brand-text">
                THE FOURTH<br />CLOVER
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                A minimalist platform for thoughtful writers. Share your stories, 
                build your audience, and connect with readers who value quality content.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-foreground text-background hover:bg-foreground/90">
                  <Link href={user ? "/write" : "/auth/signup"}>
                    {user ? "Start Writing" : "Begin Writing"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="minimal-button">
                  <Link href="/explore">
                    Explore Stories
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Posts */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Badge variant="secondary" className="mb-4">
                <TrendingUp className="w-4 h-4 mr-2" />
                Featured Stories
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 brand-text">Latest From Our Writers</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover thoughtful, well-crafted stories from our community of writers
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 elegant-card-hover h-full">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.cover}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{post.author.name}</p>
                          <p className="text-xs text-muted-foreground">@{post.author.username}</p>
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2 group-hover:text-muted-foreground transition-colors brand-text">
                        <Link href={`/post/${post.id}`}>
                          {post.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col flex-1">
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{post.readTime}m read</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{post.comments}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-12"
            >
              <Button variant="outline" asChild className="minimal-button">
                <Link href="/explore">
                  View All Stories
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 brand-text">Built for Writers</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every feature designed to help you focus on what matters most: your writing.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="text-center h-full elegant-card">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                        <feature.icon className="w-6 h-6 text-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2 brand-text">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 brand-text">
                Start Your Writing Journey
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join a community of thoughtful writers who value quality over quantity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-foreground text-background hover:bg-foreground/90">
                  <Link href={user ? "/write" : "/auth/signup"}>
                    {user ? "Start Writing Now" : "Create Your Account"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="minimal-button">
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}