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
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  User,
  Globe,
  Twitter,
  Github,
  Loader2,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { getProfile, updateProfile } from "@/lib/database-operations";
import { Profile } from "@/lib/database-types";
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
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await getProfile(user.id);

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

    fetchProfile();
  }, [user, router, form]);

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
                <CardTitle className="text-xl brand-text">
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSave)}
                    className="space-y-6"
                  >
                    {/* Avatar */}
                    <div className="text-center">
                      <div className="relative inline-block">
                        <Avatar className="w-24 h-24 mx-auto">
                          <AvatarImage src={form.watch("avatar_url") || ""} />
                          <AvatarFallback className="text-lg">
                            {form.watch("full_name")?.[0] ||
                              form.watch("username")?.[0] ||
                              user.email?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() =>
                            document.getElementById("avatar-upload")?.click()
                          }
                        >
                          {isUploading ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <Camera className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                      </div>
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name="avatar_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                Avatar URL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/avatar.jpg"
                                  {...field}
                                  value={field.value || ""}
                                  className="mt-1 focus-ring"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Full Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your full name"
                                {...field}
                                value={field.value || ""}
                                className="mt-1 focus-ring"
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
                            <FormLabel className="text-sm font-medium">
                              Username
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your username"
                                {...field}
                                className="mt-1 focus-ring"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Bio */}
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Bio
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about yourself..."
                              {...field}
                              value={field.value || ""}
                              className="mt-1 focus-ring"
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Social Links */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold brand-text">
                        Social Links
                      </h3>

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center space-x-2">
                              <Globe className="w-4 h-4" />
                              <span>Website</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://yourwebsite.com"
                                {...field}
                                value={field.value || ""}
                                className="mt-1 focus-ring"
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
                            <FormLabel className="text-sm font-medium flex items-center space-x-2">
                              <Twitter className="w-4 h-4" />
                              <span>Twitter Username</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="yourusername"
                                {...field}
                                value={field.value || ""}
                                className="mt-1 focus-ring"
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
                            <FormLabel className="text-sm font-medium flex items-center space-x-2">
                              <Github className="w-4 h-4" />
                              <span>GitHub Username</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="yourusername"
                                {...field}
                                value={field.value || ""}
                                className="mt-1 focus-ring"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-foreground text-background hover:bg-foreground/90"
                      >
                        {isSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
