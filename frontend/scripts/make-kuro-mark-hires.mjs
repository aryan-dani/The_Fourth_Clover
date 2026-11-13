import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const markPath =
  "C:/Users/dania/Documents/Stuff/My_Repositories/Domain_Based/Agentic_AI/Kuro/assets/branding/kuro-mark.svg";
const outPath = path.join(__dirname, "content", "kuro-mark-1024.png");

await sharp(markPath, { density: 400 })
  .resize({ width: 1024, height: 1024, fit: "contain", background: "#F5F4EE" })
  .png()
  .toFile(outPath);

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const authorId = "24cf47ad-16d8-4ab9-be89-30e9bf5aa716";
const dest = `${authorId}/kuro-flagship/${Date.now()}-mark-1024.png`;
const buf = fs.readFileSync(outPath);
const { data, error } = await sb.storage
  .from("post-images")
  .upload(dest, buf, { contentType: "image/png", upsert: true });
if (error) throw error;

const url = sb.storage.from("post-images").getPublicUrl(data.path).data
  .publicUrl;
console.log("MARK", url);

const urlsPath = path.join(__dirname, "content", "kuro-asset-urls.json");
const urls = JSON.parse(fs.readFileSync(urlsPath, "utf8"));
urls["mark-hires"] = url;
fs.writeFileSync(urlsPath, JSON.stringify(urls, null, 2));
console.log("urls updated");
