#!/usr/bin/env node
/**
 * One-time repair: rewrite non-kebab Journal slugs so /post/[slug] links stop 404ing.
 *
 * Usage (from frontend/):
 *   node scripts/repair-post-slugs.mjs          # dry-run
 *   node scripts/repair-post-slugs.mjs --apply  # write updates
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const SAFE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const apply = process.argv.includes("--apply");

function generateSlug(title) {
  return String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: posts, error } = await supabase
  .from("posts")
  .select("id, title, slug, status")
  .order("created_at", { ascending: false });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const used = new Set((posts || []).map((p) => p.slug).filter(Boolean));
const repairs = [];

for (const post of posts || []) {
  if (!post.slug || SAFE.test(post.slug)) continue;
  let next = generateSlug(post.title) || generateSlug(post.slug.replace(/_/g, " "));
  if (!next) continue;
  if (next === post.slug) continue;

  let candidate = next;
  let n = 2;
  while (used.has(candidate) && candidate !== post.slug) {
    candidate = `${next}-${n}`;
    n += 1;
  }
  used.delete(post.slug);
  used.add(candidate);
  repairs.push({ id: post.id, title: post.title, from: post.slug, to: candidate });
}

if (repairs.length === 0) {
  console.log("All post slugs are already kebab-case.");
  process.exit(0);
}

console.log(`${apply ? "Applying" : "Dry-run"} ${repairs.length} slug repair(s):`);
for (const r of repairs) {
  console.log(`  ${r.from}  →  ${r.to}  (${r.title})`);
}

if (!apply) {
  console.log("\nRe-run with --apply to write updates.");
  process.exit(0);
}

for (const r of repairs) {
  const { error: updateError } = await supabase
    .from("posts")
    .update({ slug: r.to })
    .eq("id", r.id);
  if (updateError) {
    console.error(`Failed ${r.from}: ${updateError.message}`);
    process.exit(1);
  }
}

console.log(`Updated ${repairs.length} post slug(s).`);
