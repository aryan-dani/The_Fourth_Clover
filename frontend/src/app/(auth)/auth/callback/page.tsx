"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { devLog } from "@/lib/dev/log";
import { syncUserVerificationStatusAction } from "@/features/data/csi-verification-actions";

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Completing Google sign in...");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const redirectVerifiedOrUnverified = async () => {
      const check = await syncUserVerificationStatusAction();
      setStatus("success");
      if (check.verified) {
        setMessage("Sign in successful! Redirecting to CSI Tech Weekly...");
        setTimeout(() => {
          window.location.replace("/tech-weekly");
        }, 350);
      } else {
        setMessage("Signed in! Redirecting to CSI ID verification...");
        setTimeout(() => {
          window.location.replace("/verify-csi");
        }, 350);
      }
    };

    const handleCallback = async () => {
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

      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (existingSession) {
          devLog("Session already exists, checking verification status...");
          await redirectVerifiedOrUnverified();
          return;
        }
      } catch (err) {
        console.error("Error checking existing session:", err);
      }

      const code = searchParams.get("code");

      if (code) {
        try {
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              await redirectVerifiedOrUnverified();
              return;
            }

            setStatus("error");
            setMessage(`Authentication failed: ${exchangeError.message}`);
            setTimeout(() => (window.location.href = "/auth/signin"), 3000);
            return;
          }

          if (data.session) {
            await redirectVerifiedOrUnverified();
            return;
          }
        } catch (err) {
          console.error("Exchange error:", err);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 900));

      const {
        data: { session: finalSession },
      } = await supabase.auth.getSession();

      if (finalSession) {
        await redirectVerifiedOrUnverified();
        return;
      }

      setStatus("error");
      setMessage("Sign in failed. Please try again.");
      setTimeout(() => (window.location.href = "/auth/signin"), 3000);
    };

    void handleCallback();
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
