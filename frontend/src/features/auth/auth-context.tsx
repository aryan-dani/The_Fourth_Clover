"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { getProfile } from "@/features/data/database-operations";
import type { AuthContextType } from "./auth-context-types";

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// Helper to clear all Supabase auth data from localStorage
const clearAuthStorage = () => {
  if (typeof window === "undefined") return;

  try {
    // Clear all Supabase-related keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.error("Error clearing auth storage:", e);
  }
};

// Custom hook to subscribe to auth state - this ensures React re-renders when auth changes
function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting initial session:", error.message);
          // Clear corrupted data
          if (
            error.message.includes("Refresh Token") ||
            error.message.includes("Invalid") ||
            error.message.includes("expired")
          ) {
            clearAuthStorage();
          }
          setSession(null);
        } else {
          setSession(initialSession);
        }
      } catch (e) {
        console.error("Exception getting session:", e);
        setSession(null);
      } finally {
        setInitialized(true);
      }
    };

    getInitialSession();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (process.env.NODE_ENV === "development") {
        console.log("Auth event:", event, newSession?.user?.email);
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
      } else if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "INITIAL_SESSION"
      ) {
        setSession(newSession);
      } else {
        setSession(newSession);
      }

      setInitialized(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, initialized };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, initialized } = useSupabaseAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const lastFetchedUserId = useRef<string | null>(null);
  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;

  const user = session?.user ?? null;
  const loading = !initialized || profileLoading;

  const fetchProfile = useCallback(async (userId: string) => {
    if (lastFetchedUserId.current === userId && profileRef.current) {
      return profileRef.current;
    }

    setProfileLoading(true);
    try {
      const { data } = await getProfile(userId);
      if (data) {
        setProfile(data);
        lastFetchedUserId.current = userId;
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const uid = user?.id;
    if (uid) {
      lastFetchedUserId.current = null;
      await fetchProfile(uid);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    const uid = user?.id;
    if (uid && lastFetchedUserId.current !== uid) {
      fetchProfile(uid);
    } else if (!uid) {
      setProfile(null);
      lastFetchedUserId.current = null;
    }
  }, [user?.id, fetchProfile]);

  const signOut = useCallback(async () => {
    // Clear profile immediately
    setProfile(null);
    lastFetchedUserId.current = null;

    try {
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("Error signing out:", error);
    }

    // Clear storage
    clearAuthStorage();

    // Force reload to clear all state
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
