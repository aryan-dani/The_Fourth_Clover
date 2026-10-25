#!/usr/bin/env node
/**
 * CSI MIT-WPU Roster Seeder
 * Usage: npm run seed:roster -- ./roster.csv
 *
 * Security invariants:
 * - Reads a local, gitignored CSV file. Never commit any roster CSV or PII.
 * - Assigns roles strictly by CSI ID and Dept (never by name):
 *     303        -> super_admin
 *     241, 246   -> tech_head (never 302)
 *     Dept=Tech  -> tech_member
 *     Otherwise  -> member
 * - Hashes PRNs using HMAC-SHA256 with PRN_HASH_SECRET. Plaintext PRNs never touch the DB.
 * - Flags blank PRNs (prn_missing = true, prn_hash = null) for manual Super Admin linking.
 * - Detects and flags duplicate PRNs across rows (e.g. IDs 230 and 307), sets
 *   prn_duplicate = true and prn_hash = null so they do not auto-link, and reports them.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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
loadEnvFile(path.resolve(__dirname, "../../.env.local"));
loadEnvFile(path.resolve(__dirname, "../../.env"));

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV file must contain a header row and at least one data row.");
  }

  const rawHeaders = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9_]/g, "")
  );

  const findCol = (candidates) => {
    for (const c of candidates) {
      const idx = rawHeaders.indexOf(c);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idIdx = findCol(["csiid", "id", "memberid", "srno", "rollno"]);
  const nameIdx = findCol(["name", "fullname", "membername", "studentname"]);
  const deptIdx = findCol(["dept", "department", "domain", "team"]);
  const yearIdx = findCol(["year", "academic_year", "academicyear", "class"]);
  const prnIdx = findCol(["prn", "prnno", "prnnumber"]);

  if (idIdx === -1 || nameIdx === -1 || deptIdx === -1) {
    throw new Error(
      `CSV headers must include CSI ID, Name, and Dept columns. Found headers: ${lines[0]}`
    );
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const rawId = cols[idIdx] || "";
    const numericId = parseInt(rawId.replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(numericId)) {
      console.warn(`[WARN] Skipping line ${i + 1}: invalid CSI ID "${rawId}"`);
      continue;
    }

    const name = (cols[nameIdx] || "").trim();
    const rawDept = (cols[deptIdx] || "").trim();
    const year = yearIdx !== -1 ? (cols[yearIdx] || "").trim() || null : null;
    const rawPrn = prnIdx !== -1 ? (cols[prnIdx] || "").trim().replace(/\s+/g, "") : "";

    const normalizedDept =
      rawDept.toLowerCase() === "tech" || rawDept.toLowerCase() === "technical"
        ? "Tech"
        : rawDept || "General";

    rows.push({
      lineNumber: i + 1,
      csi_id: numericId,
      name: name || `CSI Member #${numericId}`,
      dept: normalizedDept,
      year,
      rawPrn,
    });
  }

  return rows;
}

function computeRoleByCsiId(csiId, dept) {
  if (csiId === 303) return "super_admin";
  if (csiId === 241 || csiId === 246) return "tech_head";
  if (String(dept).trim().toLowerCase() === "tech") return "tech_member";
  return "member";
}

// Must match frontend verification + admin upsert defaults exactly.
const DEFAULT_PRN_HMAC_SECRET =
  "csi-mitwpu-fourth-clover-hmac-secret-2026";

function hashPrn(prn, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(String(prn).trim().replace(/\s+/g, ""))
    .digest("hex");
}

async function main() {
  const csvArg = process.argv[2] || "./roster.csv";
  const resolvedCsvPath = path.isAbsolute(csvArg)
    ? csvArg
    : fs.existsSync(path.resolve(process.cwd(), csvArg))
    ? path.resolve(process.cwd(), csvArg)
    : path.resolve(__dirname, "../..", csvArg);

  if (!fs.existsSync(resolvedCsvPath)) {
    console.error(`[ERROR] Roster CSV file not found at: ${resolvedCsvPath}`);
    console.error("Usage: npm run seed:roster -- ./roster.csv");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const envSecret = process.env.PRN_HASH_SECRET?.trim();
  const prnHashSecret =
    envSecret && envSecret.length >= 16
      ? envSecret
      : DEFAULT_PRN_HMAC_SECRET;

  if (!serviceRoleKey && supabaseUrl) {
    try {
      const { execSync } = require("child_process");
      const refMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
      if (refMatch) {
        const out = execSync(
          `npx supabase projects api-keys --project-ref ${refMatch[1]} -o json`,
          { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
        );
        const keys = JSON.parse(out);
        const sr = keys.find((k) => k.name === "service_role");
        if (sr && sr.api_key) {
          serviceRoleKey = sr.api_key;
        }
      }
    } catch {
      // Ignore CLI fallback error
    }
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[ERROR] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
    );
    process.exit(1);
  }

  if (!envSecret || envSecret.length < 16) {
    console.warn(
      "[WARN] PRN_HASH_SECRET not set (or too short). Using the same app default as verify/admin. Set the identical PRN_HASH_SECRET in .env.local AND Netlify or hashes will not match."
    );
  }

  const rawCsv = fs.readFileSync(resolvedCsvPath, "utf8");
  const parsedRows = parseCsv(rawCsv);

  // Detect duplicate PRNs across rows
  const prnToCsiIds = new Map();
  for (const row of parsedRows) {
    if (!row.rawPrn) continue;
    const list = prnToCsiIds.get(row.rawPrn) || [];
    list.push(row.csi_id);
    prnToCsiIds.set(row.rawPrn, list);
  }

  const duplicatePrnGroups = [];
  for (const [, csiIds] of prnToCsiIds.entries()) {
    if (csiIds.length > 1) {
      duplicatePrnGroups.push(csiIds);
    }
  }

  const duplicateCsiIdSet = new Set(duplicatePrnGroups.flat());
  const missingPrnCsiIds = [];

  const upsertPayload = parsedRows.map((row) => {
    const isMissingPrn = !row.rawPrn;
    const isDuplicatePrn = duplicateCsiIdSet.has(row.csi_id);

    if (isMissingPrn) {
      missingPrnCsiIds.push(row.csi_id);
    }

    const role = computeRoleByCsiId(row.csi_id, row.dept);

    return {
      csi_id: row.csi_id,
      name: row.name,
      dept: row.dept,
      year: row.year,
      prn_hash:
        !isMissingPrn && !isDuplicatePrn
          ? hashPrn(row.rawPrn, prnHashSecret)
          : null,
      prn_missing: isMissingPrn,
      prn_duplicate: isDuplicatePrn,
      role,
      updated_at: new Date().toISOString(),
    };
  });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase
    .from("csi_roster")
    .upsert(upsertPayload, { onConflict: "csi_id" });

  if (error) {
    console.error("[ERROR] Failed to upsert csi_roster:", error.message);
    process.exit(1);
  }

  await supabase.from("audit_log").insert({
    action: "roster.seeded",
    target_type: "csi_roster",
    target_id: "bulk",
    metadata: {
      total_seeded: upsertPayload.length,
      duplicate_csi_ids: Array.from(duplicateCsiIdSet),
      missing_prn_csi_ids: missingPrnCsiIds,
    },
  });

  const roleCounts = upsertPayload.reduce((acc, r) => {
    acc[r.role] = (acc[r.role] || 0) + 1;
    return acc;
  }, {});

  console.log("====================================================");
  console.log("CSI ROSTER SEED SUMMARY");
  console.log("====================================================");
  console.log(`Total roster rows upserted : ${upsertPayload.length}`);
  console.log(`Role distribution          :`, roleCounts);

  if (duplicatePrnGroups.length > 0) {
    console.warn("\n[FLAGGED] Duplicate PRNs detected (auto-link disabled, prn_duplicate=true):");
    for (const group of duplicatePrnGroups) {
      console.warn(`  - CSI IDs sharing identical PRN: ${group.join(", ")}`);
    }
  } else {
    console.log("\nDuplicate PRNs detected    : None");
  }

  if (missingPrnCsiIds.length > 0) {
    console.warn(
      `\n[FLAGGED] Rows with blank PRN (require manual Super Admin link): CSI IDs ${missingPrnCsiIds.join(", ")}`
    );
  } else {
    console.log("Blank PRNs detected        : None");
  }
  console.log("====================================================");
}

main().catch((err) => {
  console.error("[FATAL]", err.message || err);
  process.exit(1);
});
