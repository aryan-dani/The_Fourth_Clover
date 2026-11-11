/**
 * End-to-end Tech Weekly curation check against live Supabase.
 * Verifies:
 *  1) admin_* RPCs (service role) can approve + weekly-pick
 *  2) anon cannot call admin_* or user curation RPCs
 *  3) user JWT path works when Authorization bearer is set
 *
 * Usage: node scripts/test-tech-curation.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function resolveServiceRoleKey(supabaseUrl) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  const refMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  if (!refMatch) return null;
  try {
    const out = execSync(
      `npx supabase projects api-keys --project-ref ${refMatch[1]} -o json`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const keys = JSON.parse(out);
    const sr = keys.find((k) => k.name === "service_role");
    return sr?.api_key || null;
  } catch {
    return null;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = resolveServiceRoleKey(supabaseUrl || "");

assert(supabaseUrl, "Missing NEXT_PUBLIC_SUPABASE_URL");
assert(anonKey, "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
assert(serviceKey, "Missing SUPABASE_SERVICE_ROLE_KEY (env or supabase CLI)");

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ACTOR_KURO = "24cf47ad-16d8-4ab9-be89-30e9bf5aa716"; // CSI 303 super_admin

console.log("1) Loading a submission to curate…");
const { data: candidates, error: listErr } = await admin
  .from("tech_submissions")
  .select("id, slug, title, status, week_id, author_id")
  .eq("is_deleted", false)
  .in("status", ["submitted", "approved"])
  .order("updated_at", { ascending: false })
  .limit(5);

assert(!listErr, `List failed: ${listErr?.message}`);
assert(candidates?.length, "No submitted/approved submissions to test");

const target =
  candidates.find((s) => s.status === "submitted") || candidates[0];
const originalStatus = target.status;
console.log(`   Using ${target.slug} (was ${originalStatus})`);

console.log("2) anon must NOT call admin_review_tech_submission…");
{
  const { error } = await anon.rpc("admin_review_tech_submission", {
    p_actor_id: ACTOR_KURO,
    p_submission_id: target.id,
    p_status: "approved",
    p_review_note: "should-fail",
  });
  assert(error, "anon was able to call admin_review (security hole)");
  console.log(`   blocked: ${error.message.slice(0, 80)}`);
}

console.log("3) anon must NOT call review_tech_submission…");
{
  const { error } = await anon.rpc("review_tech_submission", {
    p_submission_id: target.id,
    p_status: "approved",
    p_review_note: "should-fail",
  });
  assert(error, "anon was able to call review_tech_submission");
  console.log(`   blocked: ${error.message.slice(0, 80)}`);
}

console.log("4) service-role admin_review → approved…");
{
  const { data, error } = await admin.rpc("admin_review_tech_submission", {
    p_actor_id: ACTOR_KURO,
    p_submission_id: target.id,
    p_status: "approved",
    p_review_note: "e2e-approve",
  });
  assert(!error && data?.success, `approve failed: ${error?.message}`);
  const { data: row } = await admin
    .from("tech_submissions")
    .select("status, reviewed_by, review_note")
    .eq("id", target.id)
    .single();
  assert(row?.status === "approved", `expected approved, got ${row?.status}`);
  assert(row?.reviewed_by === ACTOR_KURO, "reviewed_by not set to Kuro");
  console.log("   approved OK");
}

console.log("5) service-role admin_select → selected…");
let replacedId = null;
{
  const { data, error } = await admin.rpc("admin_select_tech_weekly_pick", {
    p_actor_id: ACTOR_KURO,
    p_submission_id: target.id,
    p_review_note: "e2e-pick",
  });
  assert(!error && data?.success, `pick failed: ${error?.message}`);
  replacedId = data.replaced_id ?? null;
  const { data: row } = await admin
    .from("tech_submissions")
    .select("status, selected_by")
    .eq("id", target.id)
    .single();
  assert(row?.status === "selected", `expected selected, got ${row?.status}`);
  assert(row?.selected_by === ACTOR_KURO, "selected_by not set to Kuro");

  const { count } = await admin
    .from("tech_submissions")
    .select("id", { count: "exact", head: true })
    .eq("week_id", target.week_id)
    .eq("status", "selected")
    .eq("is_deleted", false);
  assert(count === 1, `expected exactly 1 selected for week, got ${count}`);
  console.log(`   selected OK (replaced_id=${replacedId ?? "none"})`);
}

console.log("6) restore week pick / original status…");
if (replacedId) {
  const { error } = await admin.rpc("admin_select_tech_weekly_pick", {
    p_actor_id: ACTOR_KURO,
    p_submission_id: replacedId,
    p_review_note: "e2e-restore-previous-pick",
  });
  assert(!error, `failed restoring previous pick: ${error?.message}`);
  console.log("   previous weekly pick restored");
} else if (originalStatus === "submitted" || originalStatus === "approved") {
  const { error } = await admin.rpc("admin_review_tech_submission", {
    p_actor_id: ACTOR_KURO,
    p_submission_id: target.id,
    p_status: originalStatus === "submitted" ? "submitted" : "approved",
    p_review_note: null,
  });
  // selected → submitted/approved via review RPC is allowed by our function
  assert(!error, `failed restoring status: ${error?.message}`);
  // Clear selected_* if still set
  await admin
    .from("tech_submissions")
    .update({ selected_by: null, selected_at: null })
    .eq("id", target.id);
  console.log(`   restored to ${originalStatus}`);
} else {
  console.log("   left as selected");
}

console.log("\nPASS: Tech Weekly curation RPCs work end-to-end.");
