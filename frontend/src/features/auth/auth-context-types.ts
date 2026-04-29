import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export type EmptyPromise = Promise<void>;

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => EmptyPromise;
  refreshProfile: () => EmptyPromise;
}
