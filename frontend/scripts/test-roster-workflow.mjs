/**
 * End-to-end smoke test: non-Tech CSI member can verify-path capabilities
 * (submit / comment / react) against live Supabase RLS + triggers.
 *
 * Usage: node scripts/test-roster-workflow.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (+ anon key).
 * Creates a temporary auth user, assigns an unclaimed non-Tech CSI ID,
 * exercises write/comment/react, then cleans up.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.resolve(__dirname, "../.env.local"));
loadEnvFile(path.resolve(__dirname, "../.env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error("Missing Supabase URL / service role / anon key.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stamp = Date.now();
const email = `workflow.roster.test+${stamp}@example.com`;
const password = `TmpRoster!${stamp}Aa`;
let userId = null;
let csiId = null;
let weekId = null;
let submissionId = null;
let commentId = null;
const results = [];

function pass(name, detail = "") {
  results.push({ ok: true, name, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  results.push({ ok: false, name, detail });
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function cleanup() {
  if (submissionId) {
    await admin.from("tech_comments").delete().eq("submission_id", submissionId);
    await admin.from("tech_reactions").delete().eq("submission_id", submissionId);
    await admin.from("tech_submissions").delete().eq("id", submissionId);
  }
  if (csiId) {
    await admin
      .from("csi_roster")
      .update({ claimed_by: null, claimed_at: null })
      .eq("csi_id", csiId);
  }
  if (userId) {
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  }
}

try {
  // 1) Pick an unclaimed non-Tech member with a PRN hash
  const { data: rosterPick, error: rosterErr } = await admin
    .from("csi_roster")
    .select("csi_id, name, dept, role")
    .eq("role", "member")
    .is("claimed_by", null)
    .eq("prn_missing", false)
    .eq("prn_duplicate", false)
    .order("csi_id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (rosterErr || !rosterPick) {
    fail("pick_unclaimed_member", rosterErr?.message || "none available");
    process.exit(1);
  }
  csiId = rosterPick.csi_id;
  pass(
    "pick_unclaimed_member",
    `CSI #${csiId} ${rosterPick.name} (${rosterPick.dept})`,
  );

  // 2) Ensure submission window is open for the test
  const { data: settings } = await admin
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  const prevOverride = settings?.submissions_override ?? "auto";
  await admin
    .from("platform_settings")
    .update({ submissions_override: "force_open" })
    .eq("id", 1);

  const { data: week, error: weekErr } = await admin.rpc(
    "get_or_create_current_tech_week",
  );
  if (weekErr || !week?.id) {
    fail("current_week", weekErr?.message || "no week");
    await admin
      .from("platform_settings")
      .update({ submissions_override: prevOverride })
      .eq("id", 1);
    process.exit(1);
  }
  weekId = week.id;
  pass("current_week", week.week_key);

  // 3) Create temp auth user
  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Roster Workflow Test" },
    });
  if (createErr || !created.user?.id) {
    fail("create_user", createErr?.message || "no user");
    await admin
      .from("platform_settings")
      .update({ submissions_override: prevOverride })
      .eq("id", 1);
    process.exit(1);
  }
  userId = created.user.id;
  pass("create_user", userId);

  // Ensure profile row exists
  await admin.from("profiles").upsert({
    id: userId,
    username: `wf_${stamp}`,
    full_name: "Roster Workflow Test",
    role: "unverified",
  });

  // 4) Admin-assign CSI identity (non-Tech member role)
  const { error: assignErr } = await admin.rpc("admin_assign_csi_identity", {
    p_target_user_id: userId,
    p_csi_id: csiId,
    p_override_role: "member",
  });
  if (assignErr) {
    fail("assign_member_identity", assignErr.message);
    await cleanup();
    await admin
      .from("platform_settings")
      .update({ submissions_override: prevOverride })
      .eq("id", 1);
    process.exit(1);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("csi_id, role, dept")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.csi_id !== csiId || profile?.role !== "member") {
    fail(
      "assign_member_identity",
      `got csi=${profile?.csi_id} role=${profile?.role}`,
    );
  } else {
    pass(
      "assign_member_identity",
      `CSI #${profile.csi_id} role=${profile.role} dept=${profile.dept}`,
    );
  }

  // 5) Sign in as that user (anon client → JWT subject to RLS)
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signed, error: signErr } =
    await userClient.auth.signInWithPassword({ email, password });
  if (signErr || !signed.session) {
    fail("sign_in", signErr?.message || "no session");
    await cleanup();
    await admin
      .from("platform_settings")
      .update({ submissions_override: prevOverride })
      .eq("id", 1);
    process.exit(1);
  }
  pass("sign_in");

  // 6) Insert draft submission as member
  const slug = `wf-roster-test-${stamp}`;
  const { data: sub, error: subErr } = await userClient
    .from("tech_submissions")
    .insert({
      author_id: userId,
      week_id: weekId,
      title: "Roster workflow test dispatch",
      slug,
      summary: "Temporary E2E check that non-Tech members can submit.",
      content:
        "This is a temporary end-to-end workflow test submission for opening Tech Weekly to the full CSI roster. It should be deleted automatically.",
      status: "draft",
      tags: ["workflow-test"],
    })
    .select("id, status, author_id")
    .maybeSingle();

  if (subErr || !sub?.id) {
    fail("member_insert_submission", subErr?.message || "no row");
  } else {
    submissionId = sub.id;
    pass("member_insert_submission", sub.id);
  }

  // 7) Submit it
  if (submissionId) {
    const { error: submitErr } = await userClient
      .from("tech_submissions")
      .update({ status: "submitted" })
      .eq("id", submissionId);
    if (submitErr) fail("member_submit_submission", submitErr.message);
    else pass("member_submit_submission");
  }

  // 8) Comment
  if (submissionId) {
    const { data: comment, error: commentErr } = await userClient
      .from("tech_comments")
      .insert({
        submission_id: submissionId,
        user_id: userId,
        content: "Workflow test comment from a non-Tech verified member.",
      })
      .select("id")
      .maybeSingle();
    if (commentErr || !comment?.id) {
      fail("member_insert_comment", commentErr?.message || "no row");
    } else {
      commentId = comment.id;
      pass("member_insert_comment", commentId);
    }
  }

  // 9) React with insightful (was Tech-only before)
  if (submissionId) {
    const { error: reactErr } = await userClient.from("tech_reactions").insert({
      submission_id: submissionId,
      user_id: userId,
      reaction_type: "insightful",
    });
    if (reactErr) fail("member_insert_insightful_reaction", reactErr.message);
    else pass("member_insert_insightful_reaction");
  }

  // 10) Confirm is_verified_roster_member via SQL helper using admin
  const { data: rosterFn } = await admin.rpc("is_verified_roster_member", {
    uid: userId,
  });
  if (rosterFn === true) pass("is_verified_roster_member_rpc");
  else fail("is_verified_roster_member_rpc", String(rosterFn));

  // Cleanup
  await cleanup();
  await admin
    .from("platform_settings")
    .update({ submissions_override: prevOverride })
    .eq("id", 1);
  pass("cleanup");

  const failed = results.filter((r) => !r.ok);
  console.log("====================================================");
  console.log(
    `Workflow result: ${results.length - failed.length}/${results.length} passed`,
  );
  if (failed.length) {
    for (const f of failed) console.error(` - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log("Non-Tech verified member can submit, comment, and react.");
  console.log("====================================================");
} catch (err) {
  console.error("[FATAL]", err);
  try {
    await cleanup();
  } catch {
    /* ignore */
  }
  process.exit(1);
}
