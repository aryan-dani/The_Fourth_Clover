#!/usr/bin/env node

// Supabase Connection Verification Script
// Run with: node verify-supabase.js

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Supabase Connection Verification");
console.log("=====================================");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing environment variables!");
  console.log("Please check your .env.local file for:");
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
    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) {
      console.error("❌ Auth service error:", sessionError.message);
      return false;
    }
    console.log("✅ Auth service accessible");

    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (profilesError) {
      console.log("⚠️ Profiles table issue:", profilesError.message);
      if (profilesError.message.includes("does not exist")) {
        console.log(
          "💡 Run the SQL script in supabase-setup.sql to create tables"
        );
      }
    } else {
      console.log("✅ Profiles table accessible");
    }

    // Test posts table
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id")
      .limit(1);

    if (postsError) {
      console.log("⚠️ Posts table issue:", postsError.message);
    } else {
      console.log("✅ Posts table accessible");
    }

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
