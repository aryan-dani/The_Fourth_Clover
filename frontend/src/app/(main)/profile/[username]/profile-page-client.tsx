"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toTitleCase } from "@/lib/utils";
import { RelativeTime } from "@/components/time/RelativeTime";
import { PageShell } from "@/components/layout/PageShell";
import {
  Heart,
  MessageCircle,
  Clock,
  Globe,
  X,
  FileText,
  Users,
  UserPlus,
  Loader2,
} from "lucide-react";
import type { Profile } from "@/types/database";
import type { ProfilePiece } from "@/features/data/server-queries";
import { useAuth } from "@/features/auth/auth-context";
import { followUser, unfollowUser } from "@/features/data/database-operations";
import { notifyFollow } from "@/features/notifications/notifications";
import { GitHubIcon } from "@/components/icons/BrandIcons";
import { supabase } from "@/lib/supabase";

export type ProfilePageClientProps = {
  initialProfile: Profile;
  initialPieces: ProfilePiece[];
  initialStats: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    followerCount: number;
  };
};

function pieceHref(piece: ProfilePiece) {
  return piece.kind === "tech-weekly"
    ? `/tech-weekly/${piece.slug}`
    : `/post/${piece.slug}`;
}

export function ProfilePageClient({
  initialProfile: profile,
  initialPieces: pieces,
  initialStats: stats,
}: ProfilePageClientProps) {
  const { profile: sessionProfile, user } = useAuth();
  const viewerId = user?.id ?? null;
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(stats.followerCount);
  const [followBusy, setFollowBusy] = useState(false);

  const isOwnProfile = Boolean(viewerId && viewerId === profile.id);
  const canFollow = Boolean(viewerId && !isOwnProfile);

  useEffect(() => {
    if (!viewerId || viewerId === profile.id) {
      setIsFollowing(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewerId)
        .eq("following_id", profile.id)
        .maybeSingle();
      if (!cancelled) setIsFollowing(Boolean(data));
    })();
    return () => {
      cancelled = true;
    };
  }, [viewerId, profile.id]);

  const followerNotifyName =
    sessionProfile?.full_name?.trim() ||
    sessionProfile?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Someone";

  const handleToggleFollow = useCallback(async () => {
    if (!viewerId || isOwnProfile) return;
    setFollowBusy(true);
    try {
      if (isFollowing) {
        const { error } = await unfollowUser(viewerId, profile.id);
        if (!error) {
          setIsFollowing(false);
          setFollowerCount((c) => Math.max(0, c - 1));
        }
      } else {
        const { error } = await followUser(viewerId, profile.id);
        if (!error) {
          setIsFollowing(true);
          setFollowerCount((c) => c + 1);
          void notifyFollow(profile.id, viewerId, followerNotifyName);
        }
      }
    } finally {
      setFollowBusy(false);
    }
  }, [viewerId, isOwnProfile, isFollowing, profile.id, followerNotifyName]);

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 pt-20 pb-8">
        <PageShell variant="wide" className="max-w-4xl">
          <div className="mb-8 text-center">
            <div className="relative mb-4 inline-block">
              <Avatar className="mx-auto h-28 w-28 ring-4 ring-primary/25 ring-offset-4 ring-offset-background">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-3xl">
                  {profile.full_name?.[0] || profile.username[0]}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute -inset-1 -z-10 rounded-full bg-primary/15 blur-xl"
                aria-hidden
              />
            </div>

            <h1 className="mb-2 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {profile.full_name || profile.username}
            </h1>
            <p className="mb-3 font-sans text-base text-muted-foreground md:text-lg">
              @{profile.username}
            </p>

            {(profile.csi_id ||
              (profile.role && profile.role !== "unverified")) && (
              <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
                <Badge className="border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-500">
                  {profile.role === "super_admin" || profile.csi_id === 303
                    ? "CSI Technical Secretary · Super Admin"
                    : profile.role === "tech_head" ||
                        profile.csi_id === 241 ||
                        profile.csi_id === 246
                      ? "CSI Technical Head"
                      : `CSI ${profile.dept || "Tech"}${profile.year ? ` · ${profile.year}` : ""}`}
                  {profile.csi_id ? ` · #${profile.csi_id}` : ""}
                </Badge>
              </div>
            )}

            {!isOwnProfile && (
              <div className="mb-5 flex justify-center">
                {canFollow ? (
                  <Button
                    type="button"
                    size="lg"
                    variant={isFollowing ? "outline" : "default"}
                    className="min-w-[160px]"
                    disabled={followBusy}
                    onClick={() => void handleToggleFollow()}
                  >
                    {followBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      "Unfollow"
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/auth/signin">Sign in to follow</Link>
                  </Button>
                )}
              </div>
            )}

            {profile.bio && (
              <p className="mx-auto mb-5 max-w-2xl font-serif text-base leading-relaxed text-foreground md:text-lg">
                {profile.bio}
              </p>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
              {profile.website && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="transition-all hover:border-primary/50 hover:bg-primary/10"
                >
                  <a
                    href={
                      profile.website.startsWith("http://") ||
                      profile.website.startsWith("https://")
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Website
                  </a>
                </Button>
              )}
              {profile.twitter && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="transition-all hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-500"
                >
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Twitter
                  </a>
                </Button>
              )}
              {profile.github && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="transition-all hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-500"
                >
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitHubIcon className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              )}
            </div>

            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <Card className="glass border transition-colors hover:border-primary/30">
                <CardContent className="p-4 text-center">
                  <div className="mx-auto mb-2 flex w-fit items-center justify-center rounded-full bg-muted/60 p-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {stats.totalPosts}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    Posts
                  </p>
                </CardContent>
              </Card>

              <Card className="glass border transition-colors hover:border-primary/30">
                <CardContent className="p-4 text-center">
                  <div className="mx-auto mb-2 flex w-fit items-center justify-center rounded-full bg-muted/60 p-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {followerCount}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    Followers
                  </p>
                </CardContent>
              </Card>

              <Card className="glass border transition-colors hover:border-primary/30">
                <CardContent className="p-4 text-center">
                  <div className="mx-auto mb-2 flex w-fit items-center justify-center rounded-full bg-muted/60 p-2">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {stats.totalLikes}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    Likes
                  </p>
                </CardContent>
              </Card>

              <Card className="glass border transition-colors hover:border-primary/30">
                <CardContent className="p-4 text-center">
                  <div className="mx-auto mb-2 flex w-fit items-center justify-center rounded-full bg-muted/60 p-2">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {stats.totalComments}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    Comments
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="mb-5 border-b border-border/60 pb-3 text-center font-display text-xl font-semibold text-foreground sm:text-left md:text-2xl">
              Posts by {profile.full_name || profile.username}
            </h2>

            {pieces.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No Posts Yet</h3>
                <p className="text-muted-foreground">
                  {profile.full_name || profile.username} hasn&apos;t published
                  any posts yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {pieces.map((piece) => (
                  <div key={`${piece.kind}-${piece.id}`} className="relative h-full">
                    <Link
                      href={pieceHref(piece)}
                      className="absolute inset-0 z-20 rounded-[inherit]"
                      aria-label={piece.title}
                    />
                    <Card className="group glass h-full overflow-hidden border-2 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10">
                      {piece.cover_image && (
                        <div className="relative aspect-video overflow-hidden bg-muted/30">
                          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <Image
                            src={piece.cover_image}
                            alt={piece.title}
                            width={640}
                            height={360}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                      )}
                      <CardContent className="flex flex-1 flex-col p-6">
                        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          {piece.kind === "tech-weekly"
                            ? "Tech Weekly"
                            : "Journal"}
                        </p>
                        <h3 className="mb-2 line-clamp-2 text-lg font-bold transition-colors duration-300 group-hover:text-primary">
                          {piece.title}
                        </h3>

                        {piece.excerpt && (
                          <p className="mb-4 flex-1 line-clamp-3 text-sm text-muted-foreground">
                            {piece.excerpt}
                          </p>
                        )}

                        {piece.tags && piece.tags.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {piece.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs transition-colors hover:bg-primary/20"
                              >
                                {toTitleCase(tag)}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto flex items-center justify-between border-t border-primary/10 pt-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            {piece.read_time ? (
                              <div className="flex items-center space-x-1 transition-colors hover:text-primary">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{piece.read_time}m read</span>
                              </div>
                            ) : null}
                            <div className="flex items-center space-x-1 transition-colors hover:text-red-500">
                              <Heart className="h-3.5 w-3.5" />
                              <span>{piece.likesCount}</span>
                            </div>
                            <div className="flex items-center space-x-1 transition-colors hover:text-blue-500">
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>{piece.commentsCount}</span>
                            </div>
                          </div>
                          {piece.published_at ? (
                            <RelativeTime date={piece.published_at} />
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PageShell>
      </main>
    </div>
  );
}
