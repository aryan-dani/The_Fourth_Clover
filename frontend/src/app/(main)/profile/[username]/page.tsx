import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicProfilePageData } from "@/features/data/server-queries";
import { ProfilePageClient } from "./profile-page-client";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 300;
export const dynamic = "force-static";
export const fetchCache = "force-cache";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  if (decoded.toLowerCase() === "anonymous") {
    return {
      title: "Profile not found",
      description: "This writer profile could not be found on The Fourth Clover.",
    };
  }
  const { profile } = await fetchPublicProfilePageData(decoded);
  if (!profile) {
    return {
      title: "Profile not found",
      description: "This writer profile could not be found on The Fourth Clover.",
    };
  }

  const name = profile.full_name || profile.username;
  const title = `${name} (@${profile.username}) | The Fourth Clover`;
  const description =
    (profile.bio && profile.bio.slice(0, 160)) ||
    `Read posts by @${profile.username} on The Fourth Clover.`;

  const ogImage = profile.avatar_url
    ? absoluteUrl(profile.avatar_url)
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  if (decoded.toLowerCase() === "anonymous") notFound();

  const { profile, pieces, followerCount } =
    await fetchPublicProfilePageData(decoded);
  if (!profile) notFound();

  const stats = {
    totalPosts: pieces.length,
    totalLikes: pieces.reduce((sum, piece) => sum + piece.likesCount, 0),
    totalComments: pieces.reduce((sum, piece) => sum + piece.commentsCount, 0),
    followerCount,
  };

  return (
    <ProfilePageClient
      initialProfile={profile}
      initialPieces={pieces}
      initialStats={stats}
    />
  );
}
