"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Completing sign in...");
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      // Check for error in URL params first
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const error = searchParams.get("error") || hashParams.get("error");
      const errorDescription =
        searchParams.get("error_description") ||
        hashParams.get("error_description");

      if (error) {
        console.error("OAuth Error:", error, errorDescription);
        setStatus("error");
        setMessage(`Authentication failed: ${errorDescription || error}`);
        setTimeout(() => (window.location.href = "/auth/signin"), 3000);
        return;
      }

      // First, check if we already have a valid session
      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (existingSession) {
          console.log("Session already exists, redirecting...");
          setStatus("success");
          setMessage("Sign in successful! Redirecting...");
          setTimeout(() => {
            window.location.replace("/dashboard");
          }, 500);
          return;
        }
      } catch (err) {
        console.error("Error checking existing session:", err);
      }

      // Check if we have auth code in the URL (PKCE flow)
      const code = searchParams.get("code");

      if (code) {
        try {
          // Exchange the code for a session
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);

            // Check one more time if session exists (race condition with auth state listener)
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              setStatus("success");
              setMessage("Sign in successful! Redirecting...");
              setTimeout(() => {
                window.location.replace("/dashboard");
              }, 500);
              return;
            }

            setStatus("error");
            setMessage(`Authentication failed: ${exchangeError.message}`);
            setTimeout(() => (window.location.href = "/auth/signin"), 3000);
            return;
          }

          if (data.session) {
            setStatus("success");
            setMessage("Sign in successful! Redirecting...");
            setTimeout(() => {
              window.location.replace("/dashboard");
            }, 500);
            return;
          }
        } catch (err) {
          console.error("Exchange error:", err);
        }
      }

      // If no code and no session, wait a bit and check again
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const {
        data: { session: finalSession },
      } = await supabase.auth.getSession();

      if (finalSession) {
        setStatus("success");
        setMessage("Sign in successful! Redirecting...");
        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 500);
        return;
      }

      // If still no session, show error
      setStatus("error");
      setMessage("Sign in failed. Please try again.");
      setTimeout(() => (window.location.href = "/auth/signin"), 3000);
    };

    handleCallback();
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
