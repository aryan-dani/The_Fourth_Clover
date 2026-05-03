"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WriterHubShell } from "@/components/layout/WriterHubShell";
import { toast } from "sonner";
import {
  Save,
  User,
  Globe,
  Twitter,
  Github,
  Loader2,
  Camera,
} from "lucide-react";
import { getProfile, updateProfile } from "@/features/data/database-operations";
import { Profile } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      full_name: "",
      bio: "",
      avatar_url: "",
      website: "",
      twitter: "",
      github: "",
    },
  });

  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      router.push("/auth/signin");
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await getProfile(uid);

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          form.reset(data);
        } else {
          form.reset({
            username: user.email?.split("@")[0] || "",
            full_name: user.user_metadata?.full_name || "",
            avatar_url: user.user_metadata?.avatar_url || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
        toast.error("Failed to load your profile data.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProfile();
  }, [user?.id, router, form]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      if (data) {
        form.setValue("avatar_url", data.publicUrl);
        toast.success("Avatar uploaded successfully!");
        // Trigger a save to update the profile with the new avatar URL immediately
        // or just let the user click save.
        // But to see it in the header immediately, we might want to save it.
        // For now, let's just let the user click save, but if they do, refreshProfile will be called.
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(
        "Failed to upload avatar. Make sure 'avatars' bucket exists."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (values: Profile) => {
    if (!user) return;

    setIsSaving(true);
    setError("");

    try {
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(values.username)) {
        setError("Username can only contain letters, numbers, underscores, and hyphens (no spaces).");
        toast.error("Invalid username format. Please use only letters, numbers, underscores, and hyphens.");
        setIsSaving(false);
        return;
      }

      // Check username length
      if (values.username.length < 3 || values.username.length > 30) {
        setError("Username must be between 3 and 30 characters.");
        toast.error("Username must be between 3 and 30 characters.");
        setIsSaving(false);
        return;
      }

      const { error: updateError } = await updateProfile(user.id, {
        ...values,
        updated_at: new Date().toISOString(),
      });

      if (updateError) throw updateError;

      await refreshProfile(); // Refresh the profile in context to update header

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      if (err.code === "23505") {
        setError("Username already taken. Please choose a different one.");
        toast.error("That username is already in use.");
      } else {
        setError("Failed to update profile");
        toast.error("An error occurred while saving your profile.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex-1 pt-20 pb-8">
          <WriterHubShell>
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-muted rounded-3xl max-w-sm" />
              <div className="h-64 bg-muted rounded-3xl" />
              <div className="h-48 bg-muted rounded-3xl" />
            </div>
          </WriterHubShell>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="flex-1 pt-20 pb-8">
        <WriterHubShell>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Profile &amp; links
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              What readers see on your public profile and across the site.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card className="rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl shadow-lg glass">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Public identity
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Name, handle, avatar, and bio shown on your profile.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
                      <div className="relative inline-block group shrink-0 mx-auto sm:mx-0">
                        <Avatar className="w-28 h-28 ring-4 ring-primary/10 transition-all duration-300 group-hover:ring-primary/25 rounded-2xl">
                          <AvatarImage src={form.watch("avatar_url") || ""} />
                          <AvatarFallback className="text-xl rounded-2xl">
                            {form.watch("full_name")?.[0] ||
                              form.watch("username")?.[0] ||
                              user.email?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                          onClick={() =>
                            document.getElementById("avatar-upload")?.click()
                          }
                        >
                          {isUploading ? (
                            <Loader2 className="w-7 h-7 text-white animate-spin" />
                          ) : (
                            <>
                              <Camera className="w-7 h-7 text-white mb-0.5" />
                              <span className="text-[10px] text-white font-medium">
                                Upload
                              </span>
                            </>
                          )}
                        </button>
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                      </div>
                      <div className="flex-1 space-y-4 w-full min-w-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your full name"
                                    {...field}
                                    value={field.value || ""}
                                    className="rounded-xl"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="handle"
                                    {...field}
                                    className="rounded-xl"
                                    pattern="[a-zA-Z0-9_-]{3,30}"
                                    title="3–30 chars: letters, numbers, _, -"
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                  3–30 characters. Letters, numbers, underscores,
                                  hyphens.
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell readers about you..."
                                  {...field}
                                  value={field.value || ""}
                                  rows={4}
                                  className="rounded-xl resize-y min-h-[100px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl shadow-lg glass">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-display">
                      Social &amp; web
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Optional links on your public profile.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Website
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://…"
                              {...field}
                              value={field.value || ""}
                              className="rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Twitter className="w-4 h-4" />
                            Twitter
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="username"
                              {...field}
                              value={field.value || ""}
                              className="rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="github"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Github className="w-4 h-4" />
                            GitHub
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="username"
                              {...field}
                              value={field.value || ""}
                              className="rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        size="lg"
                        className="rounded-2xl"
                      >
                        {isSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Save className="w-4 h-4 mr-2" />
                        Save profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </form>
          </Form>
        </WriterHubShell>
      </main>

      <Footer />
    </div>
  );
}
