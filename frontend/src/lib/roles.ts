import type { Profile } from "@/types/database";

export type AppRole =
  | "guest"
  | "unverified"
  | "member"
  | "tech_member"
  | "tech_head"
  | "super_admin";

export type UserCapabilities = {
  canWriteJournal: boolean;
  canWriteTech: boolean;
  canReview: boolean;
  canCommentTech: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  isVerified: boolean;
  role: AppRole;
};

type ProfileLike = Partial<
  Pick<Profile, "role" | "is_admin" | "is_suspended" | "csi_id">
> | null;

/**
 * Single source of truth for UI + server capability checks.
 * Prefer profile.role / is_admin over hardcoded CSI IDs.
 *
 * Verified CSI roster members (any department) can write Tech Weekly,
 * comment, and react. Technical Heads / Super Admin still curate.
 */
export function getCapabilities(profile: ProfileLike): UserCapabilities {
  const role = (profile?.role ?? "unverified") as AppRole;
  const isSuspended = Boolean(profile?.is_suspended);
  const isAdmin = role === "super_admin" || Boolean(profile?.is_admin);
  const isTechHead = role === "tech_head" || isAdmin;
  const rosterRoles: AppRole[] = [
    "member",
    "tech_member",
    "tech_head",
    "super_admin",
  ];
  const isVerified =
    !isSuspended &&
    (isAdmin || (Boolean(profile?.csi_id) && rosterRoles.includes(role)));

  return {
    canWriteJournal: Boolean(profile) && !isSuspended,
    canWriteTech: isVerified,
    canReview: isTechHead,
    canCommentTech: isVerified,
    isAdmin,
    isSuspended,
    isVerified,
    role: profile ? role : "guest",
  };
}
