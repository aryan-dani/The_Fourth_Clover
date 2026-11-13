import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const logoPath =
  "C:/Users/dania/Documents/Stuff/My_Repositories/Domain_Based/Agentic_AI/Kuro/assets/branding/kuro-logo-full.svg";
const outPath = path.join(__dirname, "content", "kuro-cover-1600.png");
const W = 1600;
const H = 1000;
const paper = "#F5F4EE";
const ink = "#141414";

const logoBuf = await sharp(logoPath, { density: 300 })
  .resize({ width: 720, height: 720, fit: "inside" })
  .png()
  .toBuffer();
const meta = await sharp(logoBuf).metadata();
const left = Math.round((W - meta.width) / 2);
const top = Math.round((H - meta.height) / 2) - 20;

const frameSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${ink}" stroke-width="2"/>` +
    `</svg>`,
);

await sharp({
  create: { width: W, height: H, channels: 3, background: paper },
})
  .composite([
    { input: logoBuf, left, top },
    { input: frameSvg, left: 0, top: 0 },
  ])
  .png()
  .toFile(outPath);

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const authorId = "24cf47ad-16d8-4ab9-be89-30e9bf5aa716";
const dest = `${authorId}/kuro-flagship/${Date.now()}-cover-1600.png`;
const buf = fs.readFileSync(outPath);
const { data, error } = await sb.storage
  .from("post-images")
  .upload(dest, buf, { contentType: "image/png", upsert: true });
if (error) throw error;

const url = sb.storage.from("post-images").getPublicUrl(data.path).data
  .publicUrl;
const dims = await sharp(outPath).metadata();
console.log("COVER", url, `${dims.width}x${dims.height}`);

const { error: upErr } = await sb
  .from("posts")
  .update({
    cover_image: url,
    featured_image: url,
    updated_at: new Date().toISOString(),
  })
  .eq("slug", "everything-is-becoming-rust-kuro-14mb-voice-engine");
if (upErr) throw upErr;

const urlsPath = path.join(__dirname, "content", "kuro-asset-urls.json");
const urls = JSON.parse(fs.readFileSync(urlsPath, "utf8"));
urls.cover = url;
fs.writeFileSync(urlsPath, JSON.stringify(urls, null, 2));

const publishScript = path.join(__dirname, "publish-flagship-rust-kuro.mjs");
let publishSrc = fs.readFileSync(publishScript, "utf8");
publishSrc = publishSrc.replace(
  /const COVER_IMAGE =\n\s*"[^"]+";/,
  `const COVER_IMAGE =\n  "${url}";`,
);
fs.writeFileSync(publishScript, publishSrc);

console.log("post cover updated");
