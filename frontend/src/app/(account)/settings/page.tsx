"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/features/auth/auth-context";
import { updateProfile } from "@/features/data/database-operations";
import { toast } from "sonner";
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
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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
                        <TabsList className="panel grid h-12 w-full grid-cols-2 p-1">
                            <TabsTrigger
                                value="profile"
                                className="flex items-center gap-2 rounded-[calc(var(--radius)-2px)] data-[state=active]:bg-foreground data-[state=active]:text-background"
                            >
                                <User className="w-4 h-4" />
                                Profile
                            </TabsTrigger>
                            <TabsTrigger
                                value="appearance"
                                className="flex items-center gap-2 rounded-[calc(var(--radius)-2px)] data-[state=active]:bg-foreground data-[state=active]:text-background"
                            >
                                <Settings className="w-4 h-4" />
                                Appearance
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="space-y-6">
                            <section className="panel space-y-6 p-6 sm:p-8">
                                <div className="space-y-1">
                                    <h2 className="flex items-center gap-2 type-display text-xl">
                                        <User className="h-5 w-5" />
                                        Profile Information
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Update your public profile information
                                    </p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <Avatar className="h-20 w-20 ring-1 ring-[var(--fg-line)]">
                                        <AvatarImage src={profile?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-[hsl(var(--surface))] text-2xl">
                                            {formData.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm text-muted-foreground">
                                        Avatar is synced from your authentication provider
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name" className="type-label text-muted-foreground">
                                            Full Name
                                        </Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="type-label text-muted-foreground">
                                            Username
                                        </Label>
                                        <Input
                                            id="username"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                                            placeholder="username"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio" className="type-label text-muted-foreground">
                                        Bio
                                    </Label>
                                    <Textarea
                                        id="bio"
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Tell us about yourself..."
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label className="type-label text-muted-foreground">Social Links</Label>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                placeholder="Website URL"
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Twitter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                value={formData.twitter}
                                                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                                placeholder="Twitter username"
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                value={formData.github}
                                                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                                placeholder="GitHub username"
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button onClick={handleSaveProfile} disabled={saving}>
                                    {saving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </section>

                            <section className="panel space-y-6 p-6 sm:p-8">
                                <div className="space-y-1">
                                    <h2 className="flex items-center gap-2 type-display text-xl">
                                        <Mail className="h-5 w-5" />
                                        Email &amp; Security
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Manage your account security settings
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="type-label text-muted-foreground">Email Address</Label>
                                    <Input
                                        value={user.email || ""}
                                        disabled
                                        className="bg-[hsl(var(--surface))]"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Authenticated via Google OAuth.
                                    </p>
                                </div>
                            </section>

                            <section className="panel space-y-4 border-destructive/40 p-6 sm:p-8">
                                <div className="space-y-1">
                                    <h2 className="flex items-center gap-2 type-display text-xl text-destructive">
                                        <Shield className="h-5 w-5" />
                                        Danger Zone
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Irreversible account actions
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius)] border border-destructive/30 bg-destructive/5 p-4">
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
                                <p className="text-xs text-muted-foreground">
                                    Account deletion is currently disabled. Contact support for assistance.
                                </p>
                            </section>
                        </TabsContent>

                        <TabsContent value="appearance" className="space-y-6">
                            <section className="panel space-y-6 p-6 sm:p-8">
                                <div className="space-y-1">
                                    <h2 className="flex items-center gap-2 type-display text-xl">
                                        <Settings className="h-5 w-5" />
                                        Appearance
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Parchment in light mode, forest in dark mode.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--fg-line)] p-4">
                                    <div>
                                        <p className="font-medium">Color mode</p>
                                        <p className="text-sm text-muted-foreground">
                                            Switch between parchment and forest.
                                        </p>
                                    </div>
                                    <ThemeToggle />
                                </div>
                            </section>
                        </TabsContent>
                    </Tabs>
                </PageShell>
            </main>

        </div>
    );
}
