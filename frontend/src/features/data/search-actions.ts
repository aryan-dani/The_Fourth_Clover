"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SearchHit = {
  id: string;
  title: string;
  slug: string;
  kind: "journal" | "tech" | "author";
  excerpt?: string | null;
};

function mapHit(row: Record<string, unknown>): SearchHit {
  const kind =
    row.kind === "tech"
      ? "tech"
      : row.kind === "author"
        ? "author"
        : "journal";
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    kind,
    excerpt: (row.excerpt as string | null) ?? null,
  };
}

export async function searchContentAction(
  q: string,
  limit = 12,
): Promise<{ hits: SearchHit[] }> {
  const trimmed = q.trim().slice(0, 120);
  if (trimmed.length < 2) return { hits: [] };

  const supabase = await createSupabaseServerClient();
  const lim = Math.min(Math.max(limit, 1), 40);

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "search_content",
    { q: trimmed, lim },
  );

  if (!rpcError && Array.isArray(rpcData)) {
    return { hits: rpcData.map((row) => mapHit(row as Record<string, unknown>)) };
  }

  // Client-side fallback when RPC is unavailable / outdated.
  const safe = trimmed.replace(/[%_,]/g, "");
  const pattern = `%${safe}%`;

  const [authorsRes, postsRes, techRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, full_name, bio")
      .or(`username.ilike.${pattern},full_name.ilike.${pattern}`)
      .not("username", "is", null)
      .limit(lim),
    supabase
      .from("posts")
      .select(
        "id, title, slug, excerpt, author:profiles!posts_author_id_fkey(username, full_name)",
      )
      .eq("status", "published")
      .is("publication_id", null)
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .order("published_at", { ascending: false })
      .limit(lim),
    supabase
      .from("tech_submissions")
      .select(
        "id, title, slug, summary, author:profiles!tech_submissions_author_id_fkey(username, full_name)",
      )
      .in("status", ["submitted", "approved", "selected", "archived"])
      .or(`title.ilike.${pattern},summary.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(lim),
  ]);

  // Also pull pieces whose author name matches (join filter is unreliable via .or).
  const authorIds = (authorsRes.data || []).map((a) => a.id);
  let postsByAuthor: typeof postsRes.data = [];
  let techByAuthor: typeof techRes.data = [];
  if (authorIds.length > 0) {
    const [pba, tba] = await Promise.all([
      supabase
        .from("posts")
        .select(
          "id, title, slug, excerpt, author:profiles!posts_author_id_fkey(username, full_name)",
        )
        .eq("status", "published")
        .in("author_id", authorIds)
        .order("published_at", { ascending: false })
        .limit(lim),
      supabase
        .from("tech_submissions")
        .select(
          "id, title, slug, summary, author:profiles!tech_submissions_author_id_fkey(username, full_name)",
        )
        .in("status", ["submitted", "approved", "selected", "archived"])
        .in("author_id", authorIds)
        .order("created_at", { ascending: false })
        .limit(lim),
    ]);
    postsByAuthor = pba.data || [];
    techByAuthor = tba.data || [];
  }

  const postMap = new Map<string, SearchHit>();
  for (const p of [...(postsRes.data || []), ...postsByAuthor]) {
    postMap.set(p.id, {
      id: p.id,
      title: p.title,
      slug: p.slug,
      kind: "journal",
      excerpt: p.excerpt,
    });
  }
  const techMap = new Map<string, SearchHit>();
  for (const t of [...(techRes.data || []), ...techByAuthor]) {
    techMap.set(t.id, {
      id: t.id,
      title: t.title,
      slug: t.slug,
      kind: "tech",
      excerpt: t.summary,
    });
  }

  const authorHits: SearchHit[] = (authorsRes.data || [])
    .filter((a) => a.username)
    .map((a) => ({
      id: a.id,
      title: a.full_name?.trim() || a.username!,
      slug: a.username!,
      kind: "author" as const,
      excerpt: a.bio?.trim()?.slice(0, 160) || "Writer profile",
    }));

  const hits: SearchHit[] = [
    ...authorHits,
    ...postMap.values(),
    ...techMap.values(),
  ].slice(0, lim);

  return { hits };
}
