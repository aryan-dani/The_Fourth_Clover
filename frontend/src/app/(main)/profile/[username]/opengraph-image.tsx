import { createOgImage } from "@/lib/og";
import { fetchPublicProfilePageData } from "@/features/data/server-queries";

export const alt = "Writer profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProfileOgImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const { profile } = await fetchPublicProfilePageData(decoded);
  const name = profile?.full_name || profile?.username || decoded;

  return createOgImage({
    title: name,
    sectionLabel: profile ? `@${profile.username}` : "Profile",
  });
}
