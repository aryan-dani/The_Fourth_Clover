import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchFollowingFeedInitial,
  countAccountsFollowedByUser,
} from "@/features/data/server-queries";
import { FollowingFeedClient } from "./following-feed-client";

export const dynamic = "force-dynamic";

const FOLLOWING_PAGE_SIZE = 20;

export default async function FollowingFeedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  const [feedResult, followingCount] = await Promise.all([
    fetchFollowingFeedInitial(user.id, FOLLOWING_PAGE_SIZE, 0),
    countAccountsFollowedByUser(user.id),
  ]);
  const { posts, error } = feedResult;
  const initialHasMore = posts.length === FOLLOWING_PAGE_SIZE;

  return (
    <FollowingFeedClient
      viewerId={user.id}
      initialPosts={posts}
      initialLoadError={error}
      pageSize={FOLLOWING_PAGE_SIZE}
      initialHasMore={initialHasMore}
      accountsYouFollow={followingCount}
    />
  );
}
