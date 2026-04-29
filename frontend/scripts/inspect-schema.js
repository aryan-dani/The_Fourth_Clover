#!/usr/bin/env node

// Supabase Schema Inspector
// Run from repo root: node frontend/scripts/inspect-schema.js

const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing environment variables in frontend/.env.local (run from repo root)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  console.log("🔍 Inspecting Supabase Database Schema");
  console.log("=====================================\n");

  try {
    // Get table information from information_schema
    console.log("📋 Fetching table structure...\n");

    const { data: tables, error: tablesError } = await supabase.rpc(
      "get_table_info"
    );

    if (tablesError) {
      console.log(
        "⚠️ Could not fetch table info via RPC, trying direct queries...\n"
      );

      // Try to get basic table info by querying each known table
      const knownTables = ["profiles", "posts"];

      for (const tableName of knownTables) {
        console.log(`🔸 Table: ${tableName}`);
        console.log("=".repeat(40));

        try {
          // Get sample data structure
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select("*")
            .limit(1);

          if (sampleError) {
            console.log(
              `❌ Error accessing ${tableName}: ${sampleError.message}\n`
            );
            continue;
          }

          if (sampleData && sampleData.length > 0) {
            console.log("📄 Sample record structure:");
            const sample = sampleData[0];
            Object.keys(sample).forEach((key) => {
              const value = sample[key];
              const type = typeof value;
              console.log(
                `  ${key}: ${type} ${
                  value !== null
                    ? `(example: ${JSON.stringify(value)})`
                    : "(nullable)"
                }`
              );
            });
          } else {
            console.log("📄 Table exists but is empty");

            // Try to insert a test record to see the structure
            console.log("🔍 Attempting to determine structure...");
          }

          // Get row count
          const { count, error: countError } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });

          if (!countError) {
            console.log(`📊 Total records: ${count}`);
          }
        } catch (err) {
          console.log(`❌ Error inspecting ${tableName}: ${err.message}`);
        }

        console.log("\n");
      }
    } else {
      console.log("✅ Successfully fetched table information:");
      console.log(JSON.stringify(tables, null, 2));
    }

    // Test some basic queries to understand the schema
    console.log("🧪 Testing query capabilities...\n");

    // Test profiles table
    console.log("👤 Profiles table test:");
    const { data: profileTest, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, full_name, created_at")
      .limit(3);

    if (profileError) {
      console.log(`❌ Profiles error: ${profileError.message}`);
    } else {
      console.log(`✅ Found ${profileTest.length} profiles`);
      if (profileTest.length > 0) {
        console.log("Sample profiles:", JSON.stringify(profileTest, null, 2));
      }
    }

    console.log("\n📝 Posts table test:");
    const { data: postTest, error: postError } = await supabase
      .from("posts")
      .select("id, title, status, author_id, created_at")
      .limit(3);

    if (postError) {
      console.log(`❌ Posts error: ${postError.message}`);
    } else {
      console.log(`✅ Found ${postTest.length} posts`);
      if (postTest.length > 0) {
        console.log("Sample posts:", JSON.stringify(postTest, null, 2));
      }
    }
  } catch (error) {
    console.error("💥 Schema inspection failed:", error.message);
  }
}

inspectSchema();
