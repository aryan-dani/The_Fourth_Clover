#!/usr/bin/env node
/**
 * Publish the flagship Rust/Kuro Journal article.
 * Usage (from frontend/): node scripts/publish-flagship-rust-kuro.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const AUTHOR_ID = "24cf47ad-16d8-4ab9-be89-30e9bf5aa716"; // Aryan Dani / Kuro
const SLUG = "everything-is-becoming-rust-kuro-14mb-voice-engine";
const TITLE =
  "Everything Is Becoming Rust: The AI Compiler Loop, Discord's Client Shift, and How We Rewrote Kuro into a 14.2 MB Bare-Metal Voice Engine";
const EXCERPT =
  "Why the industry is rewriting everything in Rust—from Discord's client to local AI—and how we rebuilt Kuro as a 14.2 MB native Windows voice engine with AVX2 routing, Kokoro TTS, and zero-Python STT.";
const TAGS = [
  "Rust",
  "Systems Engineering",
  "Local AI",
  "Kuro",
  "SIMD",
  "Desktop",
];

const COVER_IMAGE =
  "https://fntnxpwxuxtztyqoiika.supabase.co/storage/v1/object/public/post-images/24cf47ad-16d8-4ab9-be89-30e9bf5aa716/kuro-flagship/1794569443947-tray-speaking.png";

const contentPath = path.join(__dirname, "content", "flagship-rust-kuro.html");
const content = fs.readFileSync(contentPath, "utf8").trim();

const wordCount = content
  .replace(/<[^>]+>/g, " ")
  .split(/\s+/)
  .filter(Boolean).length;
const readTime = Math.max(1, Math.ceil(wordCount / 220));

const sb = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const payload = {
  title: TITLE,
  slug: SLUG,
  content,
  excerpt: EXCERPT,
  status: "published",
  format: "prose",
  tags: TAGS,
  read_time: readTime,
  author_id: AUTHOR_ID,
  publication_id: null,
  is_anonymous: false,
  cover_image: COVER_IMAGE,
  featured_image: COVER_IMAGE,
  published_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const { data: existing, error: lookupError } = await sb
  .from("posts")
  .select("id, slug, status")
  .eq("slug", SLUG)
  .maybeSingle();

if (lookupError) {
  console.error("Lookup failed:", lookupError);
  process.exit(1);
}

let result;
if (existing?.id) {
  const { data, error } = await sb
    .from("posts")
    .update(payload)
    .eq("id", existing.id)
    .select("id, slug, status, published_at, read_time")
    .single();
  result = { data, error, action: "updated" };
} else {
  const { data, error } = await sb
    .from("posts")
    .insert(payload)
    .select("id, slug, status, published_at, read_time")
    .single();
  result = { data, error, action: "inserted" };
}

if (result.error) {
  console.error("Publish failed:", result.error);
  process.exit(1);
}

const site =
  process.env.NEXT_PUBLIC_SITE_URL || "https://fourthclover.bio";
console.log(
  JSON.stringify(
    {
      ok: true,
      action: result.action,
      words: wordCount,
      read_time: result.data.read_time,
      id: result.data.id,
      slug: result.data.slug,
      url: `${site.replace(/\/$/, "")}/post/${result.data.slug}`,
    },
    null,
    2,
  ),
);
