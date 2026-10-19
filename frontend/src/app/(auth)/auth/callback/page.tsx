"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { devLog } from "@/lib/dev/log";
import { syncUserVerificationStatusAction } from "@/features/data/csi-verification-actions";
import { CloverMark } from "@/components/layout/CloverMark";

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Completing Google sign-in...");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const redirectAfterSignIn = async () => {
      // Soft-sync verification status; do not force /verify-csi.
      // CSI verification remains optional (Journal is open; Tech Weekly still gates).
      void syncUserVerificationStatusAction();
      setStatus("success");
      setMessage("Authenticated. Opening Journal...");
      setTimeout(() => {
        window.location.replace("/journal");
      }, 350);
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
          await redirectAfterSignIn();
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
              await redirectAfterSignIn();
              return;
            }

            setStatus("error");
            setMessage(`Authentication failed: ${exchangeError.message}`);
            setTimeout(() => (window.location.href = "/auth/signin"), 3000);
            return;
          }

          if (data.session) {
            await redirectAfterSignIn();
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
        await redirectAfterSignIn();
        return;
      }

      setStatus("error");
      setMessage("Sign-in failed. Please try again.");
      setTimeout(() => (window.location.href = "/auth/signin"), 3000);
    };

    void handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background text-primary">
          <CloverMark className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            The Fourth Clover · Identity Gateway
          </p>

          {status === "loading" && (
            <div className="pt-2 space-y-3">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="pt-2 space-y-2">
              <CheckCircle2 className="h-6 w-6 mx-auto text-primary" />
              <p className="text-sm font-medium text-foreground">{message}</p>
            </div>
          )}

          {status === "error" && (
            <Alert variant="destructive" className="mt-3 text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
