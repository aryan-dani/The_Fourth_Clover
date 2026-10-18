#!/usr/bin/env node

// Supabase Connection Verification Script
// Run from repo root: node frontend/scripts/verify-supabase.js

const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Supabase Connection Verification");
console.log("=====================================");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing environment variables!");
  console.log("Please check your frontend/.env.local file for:");
  console.log("- NEXT_PUBLIC_SUPABASE_URL");
  console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

console.log("✅ Environment variables found");
console.log(`📍 Project URL: ${supabaseUrl}`);
console.log(`🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log("\n🔌 Testing connection...");

    // Test auth service
    const { error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("❌ Auth service error:", sessionError.message);
      return false;
    }
    console.log("✅ Auth service accessible");

    // Test profiles table
    const { error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (profilesError) {
      console.log("⚠️ Profiles table issue:", profilesError.message);
      return false;
    }
    console.log("✅ Profiles table accessible");

    // Test posts table (including publication_id and review_note)
    const { error: postsError } = await supabase
      .from("posts")
      .select("id, publication_id, review_note")
      .limit(1);

    if (postsError) {
      console.log("⚠️ Posts table issue:", postsError.message);
      return false;
    }
    console.log("✅ Posts table accessible (with publication_id & review_note)");

    // Test publications table and seeded 'csi' publication
    const { data: csiPub, error: pubError } = await supabase
      .from("publications")
      .select("id, slug, name")
      .eq("slug", "csi")
      .maybeSingle();

    if (pubError) {
      console.log("⚠️ Publications table issue:", pubError.message);
      return false;
    }
    if (csiPub) {
      console.log(`✅ Publications table accessible (seeded '${csiPub.slug}': ${csiPub.name})`);
    } else {
      console.log("⚠️ Publications table accessible, but 'csi' row was not found");
    }

    // Test publication_members table
    const { error: membersError } = await supabase
      .from("publication_members")
      .select("publication_id, user_id, role")
      .limit(1);

    if (membersError) {
      console.log("⚠️ Publication members table issue:", membersError.message);
      return false;
    }
    console.log("✅ Publication members table accessible");

    console.log("\n🎉 Connection test completed!");
    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    return false;
  }
}

testConnection()
  .then((success) => {
    if (success) {
      console.log("\n✨ Your Supabase project is connected and ready!");
    } else {
      console.log("\n🔧 Please check your configuration and try again.");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
