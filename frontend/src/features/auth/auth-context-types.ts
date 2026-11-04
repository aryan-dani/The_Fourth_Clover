import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export type EmptyPromise = Promise<void>;

/** Slim profile seed from SiteHeader RSC — enough for nav/capabilities. */
export type AuthProfileSeed = Pick<
  Profile,
  | "id"
  | "username"
  | "full_name"
  | "avatar_url"
  | "role"
  | "is_admin"
  | "is_suspended"
  | "csi_id"
>;

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  /** True until Supabase session bootstrap completes (`getSession` / `onAuthStateChange`). */
  loading: boolean;
  /** True while the user's profile row is being fetched (only when signed in). */
  profileLoading: boolean;
  signOut: () => EmptyPromise;
  refreshProfile: () => EmptyPromise;
  /** Seed profile from server chrome so we skip an immediate client getProfile. */
  bootstrapProfile: (seed: AuthProfileSeed) => void;
}
