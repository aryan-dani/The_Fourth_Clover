"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useSignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (formData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      toast.success("Welcome back!");
      router.push("/");
    } catch (err) {
      setError("An unexpected error occurred during sign-in.");
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        console.error("Error signing in with Google:", error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred during Google sign-in.");
      console.error("Error during Google sign-in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, signInWithGoogle, isLoading, error };
}
