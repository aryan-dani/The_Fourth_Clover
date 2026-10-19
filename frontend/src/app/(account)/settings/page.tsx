"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/features/auth/auth-context";
import { updateProfile } from "@/features/data/database-operations";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
    User,
    Settings,
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
    const { user, profile, loading, profileLoading, refreshProfile } = useAuth();

    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        bio: "",
        website: "",
        twitter: "",
        github: "",
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/signin");
        }
    }, [user?.id, loading, router]);

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

    if (loading || (user && profileLoading)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">

            <main className="flex-1 pt-20 pb-8">
                <PageShell
                    variant="default"
                    title="Settings"
                    description="Manage your account settings and preferences."
                    headerLead={
                        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to dashboard
                            </Link>
                        </Button>
                    }
                >
                    <Tabs defaultValue="profile" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 h-12">
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Profile
                            </TabsTrigger>
                            <TabsTrigger value="appearance" className="flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Appearance
                            </TabsTrigger>
                        </TabsList>

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

                                    <div className="space-y-4">
                                        <Label>Social Links</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="w-5 h-5" />
                                        Email &amp; Security
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
                                            Authenticated via Google OAuth.
                                        </p>
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

                        <TabsContent value="appearance" className="space-y-6">
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
                        </TabsContent>
                    </Tabs>
                </PageShell>
            </main>

        </div>
    );
}
