"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SearchHit = {
  id: string;
  title: string;
  slug: string;
  kind: "journal" | "tech";
  excerpt?: string | null;
};

export async function searchContentAction(
  q: string,
  limit = 12,
): Promise<{ hits: SearchHit[] }> {
  const trimmed = q.trim().slice(0, 120);
  if (trimmed.length < 2) return { hits: [] };

  const supabase = await createSupabaseServerClient();
  const lim = Math.min(Math.max(limit, 1), 40);

  // Prefer RPC when available; fall back to ILIKE queries.
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "search_content",
    { q: trimmed, lim },
  );

  if (!rpcError && Array.isArray(rpcData)) {
    return {
      hits: rpcData.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        title: String(row.title),
        slug: String(row.slug),
        kind: row.kind === "tech" ? "tech" : "journal",
        excerpt: (row.excerpt as string | null) ?? null,
      })),
    };
  }

  const pattern = `%${trimmed.replace(/[%_]/g, "")}%`;
  const [postsRes, techRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, slug, excerpt")
      .eq("status", "published")
      .is("publication_id", null)
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .order("published_at", { ascending: false })
      .limit(lim),
    supabase
      .from("tech_submissions")
      .select("id, title, slug, summary")
      .in("status", ["submitted", "approved", "selected"])
      .or(`title.ilike.${pattern},summary.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(lim),
  ]);

  const hits: SearchHit[] = [
    ...(postsRes.data || []).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      kind: "journal" as const,
      excerpt: p.excerpt,
    })),
    ...(techRes.data || []).map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      kind: "tech" as const,
      excerpt: t.summary,
    })),
  ].slice(0, lim);

  return { hits };
}
