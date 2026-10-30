"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WriterHubShell } from "@/components/layout/WriterHubShell";
import { useAuth } from "@/features/auth/auth-context";
import { updateProfile } from "@/features/data/database-operations";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

const fieldClass =
  "rounded-none border-[var(--fg-line)] bg-transparent focus-visible:ring-1 focus-visible:ring-[var(--fg)] focus-visible:ring-offset-0";

const tabTriggerClass =
  "btn-chip !h-auto !rounded-[var(--radius)] data-[state=active]:!bg-transparent data-[state=active]:border-[var(--fg)] data-[state=active]:text-[var(--bg)]";

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
      <WriterHubShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </WriterHubShell>
    );
  }

  if (!user) return null;

  return (
    <WriterHubShell>
      <header className="space-y-3">
        <p className="type-label text-muted-foreground">Account</p>
        <h1 className="type-display text-[clamp(2rem,5vw,3rem)]">Settings</h1>
        <p className="type-body max-w-xl text-sm md:text-base">
          Your public identity, links, and how the paper looks on your screen.
        </p>
      </header>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-none border-0 bg-transparent p-0">
          <TabsTrigger value="profile" className={tabTriggerClass}>
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className={tabTriggerClass}>
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0 space-y-0">
          <section className="border border-[var(--fg-line)] p-6 sm:p-8">
            <div className="border-b border-hairline pb-6">
              <p className="type-label text-muted-foreground">Identity</p>
              <h2 className="type-display mt-2 text-[clamp(1.35rem,3vw,1.85rem)]">
                Profile information
              </h2>
              <p className="type-body mt-2 max-w-xl text-sm">
                Shown on your public page, bylines, and Tech Weekly attributions.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Avatar className="h-16 w-16 ring-1 ring-[var(--fg-line)]">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-surface text-xl">
                  {formData.full_name?.[0] ||
                    user.email?.[0]?.toUpperCase() ||
                    "?"}
                </AvatarFallback>
              </Avatar>
              <p className="type-body max-w-sm text-sm">
                Avatar syncs from your Google account.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="type-label text-muted-foreground"
                >
                  Full name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Your full name"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="type-label text-muted-foreground"
                >
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      username: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, ""),
                    })
                  }
                  placeholder="username"
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="bio" className="type-label text-muted-foreground">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="A short line for your public profile…"
                rows={4}
                className={cn(fieldClass, "min-h-[7rem]")}
              />
            </div>

            <div className="mt-8 space-y-4">
              <p className="type-label text-muted-foreground">Links</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="website"
                    className="type-label text-muted-foreground"
                  >
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="twitter"
                    className="type-label text-muted-foreground"
                  >
                    Twitter / X
                  </Label>
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) =>
                      setFormData({ ...formData, twitter: e.target.value })
                    }
                    placeholder="handle"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="github"
                    className="type-label text-muted-foreground"
                  >
                    GitHub
                  </Label>
                  <Input
                    id="github"
                    value={formData.github}
                    onChange={(e) =>
                      setFormData({ ...formData, github: e.target.value })
                    }
                    placeholder="username"
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => void handleSaveProfile()}
                disabled={saving}
                className="btn-editorial btn-editorial--solid disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </section>

          <section className="mt-8 border border-[var(--fg-line)] p-6 sm:p-8">
            <p className="type-label text-muted-foreground">Security</p>
            <h2 className="type-display mt-2 text-[clamp(1.35rem,3vw,1.85rem)]">
              Email &amp; sign-in
            </h2>
            <p className="type-body mt-2 max-w-xl text-sm">
              Authentication is handled by Google through Supabase Auth.
            </p>
            <div className="mt-6 space-y-2">
              <Label className="type-label text-muted-foreground">
                Email address
              </Label>
              <Input
                value={user.email || ""}
                disabled
                className={cn(fieldClass, "bg-[hsl(var(--surface))]")}
              />
              <p className="type-label text-muted-foreground">
                Authenticated via Google OAuth
              </p>
            </div>
          </section>

          <section className="mt-8 border border-destructive/35 p-6 sm:p-8">
            <p className="type-label text-destructive">Danger zone</p>
            <h2 className="type-display mt-2 text-[clamp(1.35rem,3vw,1.85rem)] text-destructive">
              Delete account
            </h2>
            <p className="type-body mt-2 max-w-xl text-sm">
              Permanently removes your account and associated personal data.
              Publishing history may be retained under our copyright charter.
            </p>
            <div className="mt-6 flex flex-col gap-4 border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="type-body text-sm text-muted-foreground">
                Account deletion is currently disabled. Email support for help.
              </p>
              <button
                type="button"
                disabled
                className="btn-chip shrink-0 border-destructive/50 text-destructive opacity-60"
              >
                Delete account
              </button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="appearance" className="mt-0">
          <section className="border border-[var(--fg-line)] p-6 sm:p-8">
            <p className="type-label text-muted-foreground">Theme</p>
            <h2 className="type-display mt-2 text-[clamp(1.35rem,3vw,1.85rem)]">
              Appearance
            </h2>
            <p className="type-body mt-2 max-w-xl text-sm">
              Parchment in light mode, forest ink in dark mode.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-[var(--fg-line)] px-4 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">Color mode</p>
                <p className="type-body mt-1 text-sm">
                  Switch between parchment and forest.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </WriterHubShell>
  );
}
