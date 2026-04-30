import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchPublicProfilePageData,
  getProfileFollowMeta,
} from "@/features/data/server-queries";
import { ProfilePageClient } from "./profile-page-client";
import { absoluteUrl } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
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
  const { profile, posts } = await fetchPublicProfilePageData(decoded);
  if (!profile) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  const followMeta = await getProfileFollowMeta(viewerId, profile.id);

  const stats = {
    totalPosts: posts.length,
    totalLikes: posts.reduce(
      (s, p) => s + (p.likes?.[0]?.count || 0),
      0
    ),
    totalComments: posts.reduce(
      (s, p) => s + (p.comments?.[0]?.count || 0),
      0
    ),
    followerCount: followMeta.followerCount,
  };

  return (
    <ProfilePageClient
      initialProfile={profile}
      initialPosts={posts}
      initialStats={stats}
      viewerId={viewerId}
      initialIsFollowing={followMeta.isFollowing}
    />
  );
}
