"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    // Check for error in URL params first
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("OAuth Error:", error, errorDescription);
      setStatus("error");
      setMessage(`Authentication failed: ${errorDescription || error}`);
      setTimeout(() => (window.location.href = "/auth/signin"), 5000);
      return;
    }

    // Listen for auth state changes - Supabase handles the OAuth exchange automatically
    // when detectSessionInUrl is true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Callback auth state:", event, session?.user?.email);

      if (event === "SIGNED_IN" && session) {
        setStatus("success");
        setMessage("Sign in successful! Redirecting...");
        // Small delay to show success message, then redirect
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Already signed in, just redirect
        window.location.href = "/dashboard";
      }
    });

    // Also check if already signed in (in case the event already fired)
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setStatus("success");
        setMessage("Sign in successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      }
    };

    // Wait a brief moment for Supabase to process the URL, then check
    const timeoutId = setTimeout(checkSession, 1000);

    // Fallback: if nothing happens after 10 seconds, show error
    const fallbackTimeout = setTimeout(() => {
      setStatus("error");
      setMessage("Sign in is taking too long. Please try again.");
      setTimeout(() => (window.location.href = "/auth/signin"), 3000);
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="circle-logo">
              <span className="text-2xl">🍀</span>
            </div>
          </div>

          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-8 w-8 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-600 dark:text-green-400 font-medium">
                {message}
              </p>
            </>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
