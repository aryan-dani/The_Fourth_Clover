"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";
import { useSignUp } from "@/features/auth/hooks/useSignUp";
import { generateSlug } from "@/lib/utils";
import GoogleSignIn from "@/features/auth/components/GoogleSignIn";
import { motion } from "framer-motion";
import { AuthShell } from "@/components/layout/AuthShell";

export default function SignUpPage() {
  const { signUp, isLoading, error } = useSignUp();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    username: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Sanitize username input - remove spaces and special characters
    const sanitizedValue = name === "username"
      ? value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
      ...(name === "fullName" && !prev.username
        ? { username: generateSlug(value) }
        : {}),
    }));
  };

  return (
    <AuthShell quote="Start where you are. The best stories grow slowly, like clover in shade.">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Button variant="ghost" asChild>
          <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Card className="border-border/80 shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="rounded-full border border-border bg-muted/50 p-3 ring-4 ring-background">
                <span className="text-4xl leading-none" aria-hidden>
                  🍀
                </span>
              </div>
            </div>
            <CardTitle className="font-display text-2xl font-semibold">
              Create your account
            </CardTitle>
            <CardDescription className="font-sans">
              Join The Fourth Clover and start sharing your stories
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="focus-ring"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="focus-ring"
                      pattern="[a-zA-Z0-9_-]{3,30}"
                      title="Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens"
                    />
                    <p className="text-xs text-muted-foreground">
                      3-30 characters. Letters, numbers, underscores, and hyphens only.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="focus-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="focus-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="focus-ring"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <GoogleSignIn />

              <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
    </AuthShell>
  );
}
