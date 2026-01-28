"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/database-operations";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
    User,
    Settings,
    Bell,
    Shield,
    Loader2,
    Save,
    Globe,
    Twitter,
    Github,
    Mail,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// Theme Toggle Switch Component
function ThemeToggleSwitch() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <Switch disabled />;
    }

    return (
        <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => {
                setTheme(checked ? "dark" : "light");
                toast.success(`Switched to ${checked ? "dark" : "light"} mode`);
            }}
        />
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, profile, loading, refreshProfile } = useAuth();

    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        bio: "",
        website: "",
        twitter: "",
        github: "",
    });

    // Notification preferences (stored in localStorage for now)
    const [notifications, setNotifications] = useState({
        emailLikes: true,
        emailComments: true,
        emailReplies: true,
        emailNewsletter: false,
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/signin");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || "",
                username: profile.username || "",
                bio: profile.bio || "",
                website: profile.website || "",
                twitter: profile.twitter || "",
                github: profile.github || "",
            });
        }
    }, [profile]);

    // Load notification preferences from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("notification_preferences");
        if (saved) {
            setNotifications(JSON.parse(saved));
        }
    }, []);

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await updateProfile(user.id, formData);

            if (error) {
                toast.error("Failed to update profile");
                console.error(error);
            } else {
                toast.success("Profile updated successfully!");
                refreshProfile();
            }
        } catch (error) {
            toast.error("An error occurred");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationChange = (key: string, value: boolean) => {
        const updated = { ...notifications, [key]: value };
        setNotifications(updated);
        localStorage.setItem("notification_preferences", JSON.stringify(updated));
        toast.success("Notification preference updated");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-12 max-w-4xl">
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

                    <h1 className="text-4xl font-bold mb-2">Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your account settings and preferences
                    </p>
                </motion.div>

                {/* Settings Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Tabs defaultValue="profile" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3 h-12">
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Profile
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger value="account" className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Account
                            </TabsTrigger>
                        </TabsList>

                        {/* Profile Tab */}
                        <TabsContent value="profile" className="space-y-6">
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Profile Information
                                    </CardTitle>
                                    <CardDescription>
                                        Update your public profile information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Avatar */}
                                    <div className="flex items-center gap-6">
                                        <Avatar className="w-20 h-20 ring-2 ring-primary/20">
                                            <AvatarImage src={profile?.avatar_url || ""} />
                                            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                                                {formData.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Avatar is synced from your authentication provider
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name">Full Name</Label>
                                            <Input
                                                id="full_name"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                placeholder="Your full name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <Textarea
                                            id="bio"
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Tell us about yourself..."
                                            rows={4}
                                        />
                                    </div>

                                    {/* Social Links */}
                                    <div className="space-y-4">
                                        <Label>Social Links</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    value={formData.website}
                                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                    placeholder="Website URL"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    value={formData.twitter}
                                                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                                    placeholder="Twitter username"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    value={formData.github}
                                                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                                    placeholder="GitHub username"
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="w-full md:w-auto"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Save Changes
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Notifications Tab */}
                        <TabsContent value="notifications" className="space-y-6">
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bell className="w-5 h-5" />
                                        Notification Preferences
                                    </CardTitle>
                                    <CardDescription>
                                        Choose what notifications you want to receive
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-lg border">
                                            <div>
                                                <p className="font-medium">Likes</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Get notified when someone likes your post
                                                </p>
                                            </div>
                                            <Switch
                                                checked={notifications.emailLikes}
                                                onCheckedChange={(checked) => handleNotificationChange("emailLikes", checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-lg border">
                                            <div>
                                                <p className="font-medium">Comments</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Get notified when someone comments on your post
                                                </p>
                                            </div>
                                            <Switch
                                                checked={notifications.emailComments}
                                                onCheckedChange={(checked) => handleNotificationChange("emailComments", checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-lg border">
                                            <div>
                                                <p className="font-medium">Replies</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Get notified when someone replies to your comment
                                                </p>
                                            </div>
                                            <Switch
                                                checked={notifications.emailReplies}
                                                onCheckedChange={(checked) => handleNotificationChange("emailReplies", checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-lg border">
                                            <div>
                                                <p className="font-medium">Newsletter</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Receive weekly digest of popular posts
                                                </p>
                                            </div>
                                            <Switch
                                                checked={notifications.emailNewsletter}
                                                onCheckedChange={(checked) => handleNotificationChange("emailNewsletter", checked)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Account Tab */}
                        <TabsContent value="account" className="space-y-6">
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="w-5 h-5" />
                                        Email & Security
                                    </CardTitle>
                                    <CardDescription>
                                        Manage your account security settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input
                                            value={user.email || ""}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Email is managed by your authentication provider
                                        </p>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <Label>Password</Label>
                                        <p className="text-sm text-muted-foreground">
                                            To change your password, use the password reset feature on the sign-in page.
                                        </p>
                                        <Button variant="outline" asChild>
                                            <Link href="/auth/signin">
                                                Reset Password
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Appearance Card */}
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        Appearance
                                    </CardTitle>
                                    <CardDescription>
                                        Customize how the app looks
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-4 rounded-lg border">
                                        <div>
                                            <p className="font-medium">Dark Mode</p>
                                            <p className="text-sm text-muted-foreground">
                                                Switch between light and dark themes
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ThemeToggleSwitch />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass border-destructive/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-destructive">
                                        <Shield className="w-5 h-5" />
                                        Danger Zone
                                    </CardTitle>
                                    <CardDescription>
                                        Irreversible account actions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                                        <div>
                                            <p className="font-medium text-destructive">Delete Account</p>
                                            <p className="text-sm text-muted-foreground">
                                                Permanently delete your account and all data
                                            </p>
                                        </div>
                                        <Button variant="destructive" disabled>
                                            Delete Account
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Account deletion is currently disabled. Contact support for assistance.
                                    </p>
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
