import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export type EmptyPromise = Promise<void>;

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  /** True until Supabase session bootstrap completes (`getSession` / `onAuthStateChange`). */
  loading: boolean;
  /** True while the user's profile row is being fetched (only when signed in). */
  profileLoading: boolean;
  signOut: () => EmptyPromise;
  refreshProfile: () => EmptyPromise;
}
