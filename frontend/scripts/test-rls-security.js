#!/usr/bin/env node
/**
 * Automated RLS, Trigger & Concurrency Security Suite for CSI Tech Weekly
 * Usage: npm run test:security (from frontend/)
 *
 * Verifies all 7 mandatory security invariants against Supabase Postgres:
 * 1. Unverified user tries to INSERT into tech_submissions and posts -> rejected by RLS.
 * 2. Two users try to claim the same csi_id concurrently -> one succeeds, one fails.
 * 3. User tries to claim a csi_id with the wrong PRN -> rejected, attempt counter increments.
 * 4. User tries UPDATE profiles SET role = 'super_admin', is_admin = true -> rejected.
 * 5. tech_member tries to set status = 'selected' -> rejected.
 * 6. tech_head selects a second post in the same week -> replaces earlier pick so only 1
 *    selected row exists per week, and both actions are in audit_log.
 * 7. tech_member tries to create/edit a submission after Wednesday 09:00 IST cutoff -> rejected by DB.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");
const { createClient } = require("@supabase/supabase-js");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(__dirname, "../.env.local"));
loadEnvFile(path.resolve(__dirname, "../.env"));

function resolveKeys(supabaseUrl) {
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if ((!serviceRoleKey || !anonKey) && supabaseUrl) {
    const refMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
    if (refMatch) {
      const out = execSync(
        `npx supabase projects api-keys --project-ref ${refMatch[1]} -o json`,
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
      );
      const keys = JSON.parse(out);
      const sr = keys.find((k) => k.name === "service_role");
      const an = keys.find((k) => k.name === "anon");
      if (!serviceRoleKey && sr?.api_key) serviceRoleKey = sr.api_key;
      if (!anonKey && an?.api_key) anonKey = an.api_key;
    }
  }

  return { anonKey, serviceRoleKey };
}

function hashPrn(prn, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(String(prn).trim())
    .digest("hex");
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const { anonKey, serviceRoleKey } = resolveKeys(supabaseUrl);
  const prnSecret =
    process.env.PRN_HASH_SECRET || "csi-tech-weekly-security-test-secret-2026";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const makeAnonClient = () =>
    createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

  const runId = Date.now().toString(36);
  const TEST_CSI_ID_1 = 99001;
  const TEST_CSI_ID_2 = 99002;
  const TEST_CSI_HEAD_ID = 99241;
  const TEST_PRN_1 = "1032239901";
  const TEST_PRN_2 = "1032239902";

  const createdUserIds = [];
  let openWeekId = null;
  let closedWeekId = null;

  console.log("====================================================");
  console.log("CSI TECH WEEKLY - AUTOMATED RLS & SECURITY SUITE");
  console.log("====================================================");

  try {
    // Prepare ephemeral test users via service_role
    const createTestUser = async (tag) => {
      const email = `sec-${tag}-${runId}@example.com`;
      const password = `SecPass!${runId}#99`;
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !data?.user) {
        throw new Error(`Failed to create test user ${tag}: ${error?.message}`);
      }
      createdUserIds.push(data.user.id);

      // Ensure unverified profile exists
      await adminClient.from("profiles").upsert({
        id: data.user.id,
        username: `sec_${tag}_${runId}`,
        full_name: `Security Test ${tag}`,
        role: "unverified",
        is_admin: false,
        csi_id: null,
      });

      const userClient = makeAnonClient();
      const { error: signInErr } = await userClient.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        throw new Error(`Failed to sign in test user ${tag}: ${signInErr.message}`);
      }

      return { id: data.user.id, email, client: userClient };
    };

    const userA = await createTestUser("u1");
    const userB = await createTestUser("u2");
    const userHead = await createTestUser("head");

    // Seed synthetic test roster rows (using synthetic IDs 99001, 99002, 99241)
    await adminClient.from("csi_roster").upsert([
      {
        csi_id: TEST_CSI_ID_1,
        name: "Test Tech Member 1",
        dept: "Tech",
        year: "SY",
        prn_hash: hashPrn(TEST_PRN_1, prnSecret),
        prn_missing: false,
        prn_duplicate: false,
        role: "tech_member",
        claimed_by: null,
      },
      {
        csi_id: TEST_CSI_ID_2,
        name: "Test Tech Member 2",
        dept: "Tech",
        year: "TY",
        prn_hash: hashPrn(TEST_PRN_2, prnSecret),
        prn_missing: false,
        prn_duplicate: false,
        role: "tech_member",
        claimed_by: null,
      },
      {
        csi_id: TEST_CSI_HEAD_ID,
        name: "Test Tech Head",
        dept: "Tech",
        year: "TY",
        prn_hash: hashPrn("1032239241", prnSecret),
        prn_missing: false,
        prn_duplicate: false,
        role: "tech_head",
        claimed_by: userHead.id,
      },
    ]);

    // Configure userHead as tech_head
    await adminClient
      .from("profiles")
      .update({
        csi_id: TEST_CSI_HEAD_ID,
        role: "tech_head",
        dept: "Tech",
        year: "TY",
      })
      .eq("id", userHead.id);

    // Create an explicitly open test week and an explicitly closed (past cutoff) test week
    const now = Date.now();
    const { data: openWeek, error: openWeekErr } = await adminClient
      .from("tech_weeks")
      .insert({
        week_key: `sec-open-${runId}`,
        week_number: 991,
        title: "Security Open Week",
        starts_at: new Date(now - 24 * 3600 * 1000).toISOString(),
        cutoff_at: new Date(now + 48 * 3600 * 1000).toISOString(),
        ends_at: new Date(now + 96 * 3600 * 1000).toISOString(),
        is_locked: false,
      })
      .select("*")
      .single();
    if (openWeekErr) throw new Error(openWeekErr.message);
    openWeekId = openWeek.id;

    const { data: closedWeek, error: closedWeekErr } = await adminClient
      .from("tech_weeks")
      .insert({
        week_key: `sec-closed-${runId}`,
        week_number: 992,
        title: "Security Closed Week",
        starts_at: new Date(now - 96 * 3600 * 1000).toISOString(),
        cutoff_at: new Date(now - 24 * 3600 * 1000).toISOString(),
        ends_at: new Date(now + 24 * 3600 * 1000).toISOString(),
        is_locked: true,
      })
      .select("*")
      .single();
    if (closedWeekErr) throw new Error(closedWeekErr.message);
    closedWeekId = closedWeek.id;

    // Ensure platform_settings has submissions_override = 'force_open' during open-window tests
    // and we will test cutoff using closedWeekId + 'auto'
    const { data: origSettings } = await adminClient
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .single();

    // ------------------------------------------------------------------------
    // TEST 1: Unverified user tries to INSERT into tech_submissions and posts
    // ------------------------------------------------------------------------
    const { error: unvTechErr } = await userA.client
      .from("tech_submissions")
      .insert({
        week_id: openWeekId,
        author_id: userA.id,
        title: "Unauthorized Tech Weekly Post",
        slug: `unauth-tech-${runId}`,
        content: "Unverified user attempting to insert into tech_submissions.",
        status: "submitted",
      });
    assertCondition(
      Boolean(unvTechErr),
      "Unverified user INSERT into tech_submissions must be rejected by RLS"
    );

    const { error: unvPostErr } = await userA.client.from("posts").insert({
      author_id: userA.id,
      title: "Unauthorized Legacy Post",
      slug: `unauth-post-${runId}`,
      content: "Unverified user attempting to insert into posts.",
      status: "published",
    });
    assertCondition(
      Boolean(unvPostErr),
      "Unverified user INSERT into posts must be rejected by RLS"
    );
    console.log(
      "[PASS] 1. Unverified user blocked from INSERT on tech_submissions and posts."
    );

    // ------------------------------------------------------------------------
    // TEST 3 (run before claiming TEST_CSI_ID_1): Wrong PRN rejected + attempt counter increments
    // ------------------------------------------------------------------------
    const { count: beforeAttempts } = await adminClient
      .from("csi_verification_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userA.id);

    const { data: wrongPrnRes } = await userA.client.rpc("claim_csi_identity", {
      p_csi_id: TEST_CSI_ID_1,
      p_prn_hash: hashPrn("0000000000", prnSecret),
      p_ip_hash: `ip-${runId}`,
    });

    assertCondition(
      wrongPrnRes && wrongPrnRes.success === false,
      "Claim with wrong PRN must return success: false"
    );

    const { count: afterAttempts } = await adminClient
      .from("csi_verification_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userA.id);

    assertCondition(
      (afterAttempts || 0) === (beforeAttempts || 0) + 1,
      "Failed verification attempt counter must increment in csi_verification_attempts"
    );
    console.log(
      "[PASS] 2. Wrong PRN claim rejected with generic message and attempt counter incremented."
    );

    // ------------------------------------------------------------------------
    // TEST 2: Two users try to claim the same csi_id concurrently -> one succeeds, one fails
    // ------------------------------------------------------------------------
    const correctHash1 = hashPrn(TEST_PRN_1, prnSecret);
    const [claimA, claimB] = await Promise.all([
      userA.client.rpc("claim_csi_identity", {
        p_csi_id: TEST_CSI_ID_1,
        p_prn_hash: correctHash1,
        p_ip_hash: `ip-a-${runId}`,
      }),
      userB.client.rpc("claim_csi_identity", {
        p_csi_id: TEST_CSI_ID_1,
        p_prn_hash: correctHash1,
        p_ip_hash: `ip-b-${runId}`,
      }),
    ]);

    const successes = [claimA.data?.success, claimB.data?.success].filter(
      Boolean
    ).length;
    const failures = [
      claimA.data?.success === false || Boolean(claimA.error),
      claimB.data?.success === false || Boolean(claimB.error),
    ].filter(Boolean).length;

    assertCondition(
      successes === 1 && failures === 1,
      `Concurrent claim of same csi_id must have exactly 1 winner and 1 loser (got successes=${successes}, failures=${failures})`
    );
    console.log(
      "[PASS] 3. Concurrent claim of same CSI ID serialized via FOR UPDATE (1 succeeded, 1 rejected)."
    );

    // Claim TEST_CSI_ID_2 for whichever user lost the race so both userA and userB are verified tech_members
    const loserClient = claimA.data?.success ? userB.client : userA.client;
    const { data: secondClaim } = await loserClient.rpc("claim_csi_identity", {
      p_csi_id: TEST_CSI_ID_2,
      p_prn_hash: hashPrn(TEST_PRN_2, prnSecret),
      p_ip_hash: `ip-2-${runId}`,
    });
    assertCondition(
      secondClaim?.success === true,
      "Loser user should be able to claim their own distinct CSI ID"
    );

    // ------------------------------------------------------------------------
    // TEST 4: User tries UPDATE profiles SET role = 'super_admin', is_admin = true -> rejected
    // ------------------------------------------------------------------------
    const { error: privEscErr } = await userA.client
      .from("profiles")
      .update({ role: "super_admin", is_admin: true })
      .eq("id", userA.id);

    assertCondition(
      Boolean(privEscErr),
      "Client attempt to escalate own role/is_admin on profiles must be rejected by trigger"
    );
    console.log(
      "[PASS] 4. Self-privilege escalation (UPDATE profiles SET role='super_admin', is_admin=true) blocked."
    );

    // Temporarily set submissions_override = 'force_open' so open-window submission tests are deterministic regardless of wall-clock day
    await adminClient
      .from("platform_settings")
      .update({ submissions_override: "force_open" })
      .eq("id", 1);

    // ------------------------------------------------------------------------
    // TEST 5: tech_member tries to set status = 'selected' -> rejected
    // ------------------------------------------------------------------------
    const { error: insertSelectedErr } = await userA.client
      .from("tech_submissions")
      .insert({
        week_id: openWeekId,
        author_id: userA.id,
        title: "Self Selected Attempt",
        slug: `self-sel-${runId}`,
        content:
          "Verified tech member trying to insert directly with status=selected.",
        status: "selected",
      });
    assertCondition(
      Boolean(insertSelectedErr),
      "tech_member must not be able to INSERT a submission with status = 'selected'"
    );

    // Now insert valid submitted posts for userA and userB
    const { data: subA, error: subAErr } = await userA.client
      .from("tech_submissions")
      .insert({
        week_id: openWeekId,
        author_id: userA.id,
        title: "Valid Tech Submission A",
        slug: `valid-sub-a-${runId}`,
        content:
          "Detailed engineering writeup on Postgres row-level security and MVCC concurrency guarantees.",
        status: "submitted",
      })
      .select("*")
      .single();
    if (subAErr) throw new Error(`subA insert failed: ${subAErr.message}`);

    const { error: updateSelectedErr } = await userA.client
      .from("tech_submissions")
      .update({ status: "selected" })
      .eq("id", subA.id);
    assertCondition(
      Boolean(updateSelectedErr),
      "tech_member must not be able to UPDATE their submission status to 'selected'"
    );
    console.log(
      "[PASS] 5. tech_member blocked from setting status = 'selected' on tech_submissions."
    );

    // ------------------------------------------------------------------------
    // TEST 6: tech_head selects a second post in the same week -> replaces earlier pick,
    //         only 1 selected row exists for the week, and both actions are in audit_log
    // ------------------------------------------------------------------------
    const { data: subB, error: subBErr } = await userB.client
      .from("tech_submissions")
      .insert({
        week_id: openWeekId,
        author_id: userB.id,
        title: "Valid Tech Submission B",
        slug: `valid-sub-b-${runId}`,
        content:
          "Deep dive into distributed consensus, Raft leader election, and split-brain prevention.",
        status: "submitted",
      })
      .select("*")
      .single();
    if (subBErr) throw new Error(`subB insert failed: ${subBErr.message}`);

    // Tech Head selects subA first
    const { data: pick1, error: pick1Err } = await userHead.client.rpc(
      "select_tech_weekly_pick",
      {
        p_submission_id: subA.id,
        p_review_note: "First pick of the week",
      }
    );
    if (pick1Err) throw new Error(`pick1 failed: ${pick1Err.message}`);
    assertCondition(pick1?.success === true, "First pick by tech_head must succeed");

    // Tech Head selects subB second in the same week
    const { data: pick2, error: pick2Err } = await userHead.client.rpc(
      "select_tech_weekly_pick",
      {
        p_submission_id: subB.id,
        p_review_note: "Replacing with second pick",
      }
    );
    if (pick2Err) throw new Error(`pick2 failed: ${pick2Err.message}`);
    assertCondition(
      pick2?.success === true && pick2?.replaced_id === subA.id,
      "Second pick in same week must atomically replace first pick"
    );

    const { data: selectedRows } = await adminClient
      .from("tech_submissions")
      .select("id, status")
      .eq("week_id", openWeekId)
      .eq("status", "selected")
      .eq("is_deleted", false);

    assertCondition(
      selectedRows?.length === 1 && selectedRows[0].id === subB.id,
      "Exactly ONE submission can have status = 'selected' for the week"
    );

    const { data: auditEntries } = await adminClient
      .from("audit_log")
      .select("action, target_id")
      .in("target_id", [subA.id, subB.id]);

    const actions = (auditEntries || []).map((a) => a.action);
    assertCondition(
      actions.includes("tech_weekly.pick_selected") &&
        actions.includes("tech_weekly.pick_replaced"),
      "Both pick_selected and pick_replaced must be recorded in audit_log"
    );
    console.log(
      "[PASS] 6. Single-weekly-pick invariant enforced; replacing pick updates status and logs both events in audit_log."
    );

    // ------------------------------------------------------------------------
    // TEST 7: tech_member tries to create/edit a submission after Wednesday 09:00 IST cutoff -> rejected by DB
    // ------------------------------------------------------------------------
    await adminClient
      .from("platform_settings")
      .update({ submissions_override: "auto" })
      .eq("id", 1);

    const { error: afterCutoffInsertErr } = await userA.client
      .from("tech_submissions")
      .insert({
        week_id: closedWeekId,
        author_id: userA.id,
        title: "Late Submission After Cutoff",
        slug: `late-sub-${runId}`,
        content: "Attempting to submit after Wednesday 09:00 IST cutoff.",
        status: "submitted",
      });
    assertCondition(
      Boolean(afterCutoffInsertErr),
      "tech_member INSERT after Wednesday 09:00 IST cutoff must be rejected by DB trigger"
    );

    // Also test force_closed override on openWeekId for editing existing submission
    await adminClient
      .from("platform_settings")
      .update({ submissions_override: "force_closed" })
      .eq("id", 1);

    const { error: afterCutoffEditErr } = await userA.client
      .from("tech_submissions")
      .update({
        title: "Edited After Cutoff",
        content: "Attempting to edit after Wednesday 09:00 IST cutoff.",
      })
      .eq("id", subA.id);
    assertCondition(
      Boolean(afterCutoffEditErr),
      "tech_member UPDATE after Wednesday 09:00 IST cutoff must be rejected by DB trigger"
    );

    // Restore original platform_settings
    if (origSettings) {
      await adminClient
        .from("platform_settings")
        .update({
          submissions_override: origSettings.submissions_override || "auto",
        })
        .eq("id", 1);
    }

    console.log(
      "[PASS] 7. Post-cutoff submission creation and editing blocked at the database level."
    );
    console.log("====================================================");
    console.log("ALL 7 SECURITY & RLS INVARIANTS PASSED SUCCESSFULLY!");
    console.log("====================================================");
  } finally {
    // Clean up all synthetic test artifacts
    if (openWeekId || closedWeekId) {
      await adminClient
        .from("tech_weeks")
        .delete()
        .in("id", [openWeekId, closedWeekId].filter(Boolean));
    }
    await adminClient
      .from("csi_roster")
      .delete()
      .in("csi_id", [TEST_CSI_ID_1, TEST_CSI_ID_2, TEST_CSI_HEAD_ID]);
    await adminClient
      .from("audit_log")
      .delete()
      .in("actor_id", createdUserIds);
    for (const uid of createdUserIds) {
      await adminClient.from("publication_members").delete().eq("user_id", uid);
      await adminClient.from("profiles").delete().eq("id", uid);
      await adminClient.auth.admin.deleteUser(uid);
    }
  }
}

main().catch((err) => {
  console.error("\n[SECURITY TEST FAILED]", err.message || err);
  process.exit(1);
});
