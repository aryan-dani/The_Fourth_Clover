"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { Profile } from "./database-types";
import { getProfile } from "./database-operations";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

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

  // Clear our specific storage key
  localStorage.removeItem("sb-fourth-clover-auth");

  // Also clear any other Supabase-related keys
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchedUserId = useRef<string | null>(null);
  const mounted = useRef(true);

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      try {
        const { data } = await getProfile(userId);
        if (mounted.current && data) {
          setProfile(data);
          lastFetchedUserId.current = userId;
          return data;
        }
        return null;
      } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
    },
    []
  );

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const handleAuthChange = useCallback(
    async (event: AuthChangeEvent, session: Session | null) => {
      console.log("Auth state change:", event, session?.user?.email);

      if (!mounted.current) return;

      // Handle sign out events
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setProfile(null);
        lastFetchedUserId.current = null;
        setLoading(false);
        return;
      }

      // Handle sign in and token refresh
      const currentUser = session.user;
      setUser(currentUser);

      // Fetch profile if user changed
      if (currentUser && lastFetchedUserId.current !== currentUser.id) {
        await fetchProfile(currentUser.id);
      }

      setLoading(false);
    },
    [fetchProfile]
  );

  useEffect(() => {
    mounted.current = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initSession = async () => {
      try {
        // First, set up the auth state change listener
        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange(handleAuthChange);
        subscription = sub;

        // Then get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error.message);

          // Clear corrupted auth data
          if (
            error.message.includes("Refresh Token") ||
            error.message.includes("Invalid") ||
            error.message.includes("expired")
          ) {
            console.log("Clearing corrupted auth data...");
            clearAuthStorage();
            try {
              await supabase.auth.signOut({ scope: "local" });
            } catch (e) {
              // Ignore signOut errors
            }
          }

          if (mounted.current) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        if (mounted.current) {
          if (session?.user) {
            setUser(session.user);
            if (lastFetchedUserId.current !== session.user.id) {
              await fetchProfile(session.user.id);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error initializing session:", error);

        // On any error, clear storage and reset state
        clearAuthStorage();

        if (mounted.current) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initSession();

    return () => {
      mounted.current = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchProfile, handleAuthChange]);

  const signOut = async () => {
    // Immediately update UI state
    setUser(null);
    setProfile(null);
    lastFetchedUserId.current = null;

    try {
      // Clear storage first to prevent stale state on refresh
      clearAuthStorage();

      // Then sign out from Supabase
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("Error signing out:", error);
      // Force clear storage even if signOut fails
      clearAuthStorage();
    }

    // Force a clean page reload to reset all state
    window.location.href = "/";
  };

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
