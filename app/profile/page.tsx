'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { toast } from 'sonner';
import { 
  Save, 
  ArrowLeft, 
  User, 
  Globe, 
  Twitter, 
  Github,
  Loader2,
  Camera
} from 'lucide-react';
import Link from 'next/link';

interface Profile {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  website: string;
  twitter: string;
  github: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Profile>({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
    website: '',
    twitter: '',
    github: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          username: data.username || '',
          full_name: data.full_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          website: data.website || '',
          twitter: data.twitter || '',
          github: data.github || '',
        });
      } else {
        // Create a default profile if none exists
        setProfile({
          username: user.email?.split('@')[0] || '',
          full_name: user.user_metadata?.full_name || '',
          bio: '',
          avatar_url: user.user_metadata?.avatar_url || '',
          website: '',
          twitter: '',
          github: '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError('');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          website: profile.website,
          twitter: profile.twitter,
          github: profile.github,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      if (err.code === '23505') {
        setError('Username already taken. Please choose a different one.');
      } else {
        setError('Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
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
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard" className="flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <h1 className="text-2xl font-bold brand-text">Edit Profile</h1>
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="elegant-card">
              <CardHeader>
                <CardTitle className="text-xl brand-text">Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  {/* Avatar */}
                  <div className="text-center">
                    <div className="relative inline-block">
                      <Avatar className="w-24 h-24 mx-auto">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-lg">
                          {profile.full_name?.[0] || profile.username[0] || user.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="avatar_url" className="text-sm font-medium">
                        Avatar URL
                      </Label>
                      <Input
                        id="avatar_url"
                        placeholder="https://example.com/avatar.jpg"
                        value={profile.avatar_url}
                        onChange={(e) => handleChange('avatar_url', e.target.value)}
                        className="mt-1 focus-ring"
                      />
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="full_name"
                        placeholder="Your full name"
                        value={profile.full_name}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                        className="mt-1 focus-ring"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="username" className="text-sm font-medium">
                        Username
                      </Label>
                      <Input
                        id="username"
                        placeholder="Your username"
                        value={profile.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        className="mt-1 focus-ring"
                        required
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={profile.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      className="mt-1 focus-ring"
                      rows={4}
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold brand-text">Social Links</h3>
                    
                    <div>
                      <Label htmlFor="website" className="text-sm font-medium flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                      </Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.com"
                        value={profile.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        className="mt-1 focus-ring"
                      />
                    </div>

                    <div>
                      <Label htmlFor="twitter" className="text-sm font-medium flex items-center space-x-2">
                        <Twitter className="w-4 h-4" />
                        <span>Twitter Username</span>
                      </Label>
                      <Input
                        id="twitter"
                        placeholder="yourusername"
                        value={profile.twitter}
                        onChange={(e) => handleChange('twitter', e.target.value)}
                        className="mt-1 focus-ring"
                      />
                    </div>

                    <div>
                      <Label htmlFor="github" className="text-sm font-medium flex items-center space-x-2">
                        <Github className="w-4 h-4" />
                        <span>GitHub Username</span>
                      </Label>
                      <Input
                        id="github"
                        placeholder="yourusername"
                        value={profile.github}
                        onChange={(e) => handleChange('github', e.target.value)}
                        className="mt-1 focus-ring"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving} className="bg-foreground text-background hover:bg-foreground/90">
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}