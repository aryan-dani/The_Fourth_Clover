"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import type { AuthProfileSeed } from "@/features/auth/auth-context-types";

/** Seeds AuthProvider from SiteHeader RSC so soft navs skip a client profile round-trip. */
export function AuthProfileBootstrap({
  profile,
}: {
  profile: AuthProfileSeed | null;
}) {
  const { bootstrapProfile } = useAuth();

  useEffect(() => {
    if (profile) bootstrapProfile(profile);
  }, [profile, bootstrapProfile]);

  return null;
}
