"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useSignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async (formData: any) => {
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          username: formData.username,
          full_name: formData.fullName,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error(
            "Profile creation error:",
            JSON.stringify(profileError, null, 2)
          );
          toast.error(
            "Error creating your profile. Please try updating it later."
          );
        }

        toast.success(
          "Account created! Please check your email for a verification link."
        );
        router.push("/");
      }
    } catch (err) {
      setError("An unexpected error occurred during sign-up.");
    } finally {
      setIsLoading(false);
    }
  };

  return { signUp, isLoading, error };
}
