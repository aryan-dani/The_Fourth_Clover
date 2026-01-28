#!/usr/bin/env node

// Interactive Supabase Query Tool
// Run queries against your Supabase database locally

const { createClient } = require("@supabase/supabase-js");
const readline = require("readline");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema based on inspection
const SCHEMA = {
  profiles: {
    columns: [
      "id",
      "username",
      "full_name",
      "bio",
      "avatar_url",
      "website",
      "twitter",
      "github",
      "created_at",
      "updated_at",
    ],
    sample_query:
      "supabase.from('profiles').select('id, username, full_name').limit(5)",
  },
  posts: {
    columns: [
      "id",
      "title",
      "slug",
      "content",
      "excerpt",
      "featured_image",
      "cover_image",
      "author_id",
      "status",
      "tags",
      "read_time",
      "created_at",
      "updated_at",
      "published_at",
    ],
    sample_query:
      "supabase.from('posts').select('id, title, status, author_id').limit(5)",
  },
};

function printHelp() {
  console.log(`
🚀 Supabase Query Tool
======================

Available Commands:
  help                    - Show this help
  schema                  - Show database schema
  tables                  - List all tables
  describe <table>        - Show table structure
  sample <table>          - Show sample queries for table
  query <table> <query>   - Run a Supabase query
  sql <query>             - Run raw SQL (if supported)
  count <table>           - Count records in table
  exit                    - Exit the tool

Examples:
  > query posts select('id, title, status').eq('status', 'published')
  > query profiles select('username, full_name').limit(10)
  > count posts
  > describe posts

Tables: ${Object.keys(SCHEMA).join(", ")}
`);
}

function printSchema() {
  console.log("\n📋 Database Schema:");
  console.log("==================\n");

  Object.entries(SCHEMA).forEach(([table, info]) => {
    console.log(`🔸 ${table.toUpperCase()}`);
    console.log(`Columns: ${info.columns.join(", ")}`);
    console.log(`Sample: ${info.sample_query}`);
    console.log("");
  });
}

function describeTable(tableName) {
  if (!SCHEMA[tableName]) {
    console.log(
      `❌ Table '${tableName}' not found. Available: ${Object.keys(SCHEMA).join(
        ", "
      )}`
    );
    return;
  }

  const table = SCHEMA[tableName];
  console.log(`\n📋 Table: ${tableName.toUpperCase()}`);
  console.log("=".repeat(30));
  console.log(`Columns: ${table.columns.length}`);
  table.columns.forEach((col) => console.log(`  • ${col}`));
  console.log(`\nSample Query: ${table.sample_query}`);
}

async function runQuery(tableName, queryString) {
  if (!SCHEMA[tableName]) {
    console.log(
      `❌ Table '${tableName}' not found. Available: ${Object.keys(SCHEMA).join(
        ", "
      )}`
    );
    return;
  }

  try {
    console.log(`🔍 Running query on '${tableName}': ${queryString}`);

    // Build the query dynamically
    let query = supabase.from(tableName);

    // Parse the query string and apply it
    // This is a simple parser - you could extend it
    const result = eval(`query.${queryString}`);

    const { data, error, count } = await result;

    if (error) {
      console.log(`❌ Query failed: ${error.message}`);
      return;
    }

    console.log(
      `✅ Query successful! Found ${data.length} records${
        count !== null ? ` (total: ${count})` : ""
      }`
    );

    if (data.length > 0) {
      console.log("\n📄 Results:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log("📄 No records found");
    }
  } catch (err) {
    console.log(`❌ Query error: ${err.message}`);
    console.log(
      '💡 Make sure your query syntax is correct. Example: select("id, title").eq("status", "published")'
    );
  }
}

async function countRecords(tableName) {
  if (!SCHEMA[tableName]) {
    console.log(
      `❌ Table '${tableName}' not found. Available: ${Object.keys(SCHEMA).join(
        ", "
      )}`
    );
    return;
  }

  try {
    const { count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`❌ Count failed: ${error.message}`);
      return;
    }

    console.log(`📊 Table '${tableName}' has ${count} records`);
  } catch (err) {
    console.log(`❌ Count error: ${err.message}`);
  }
}

async function startQueryTool() {
  console.log("🚀 Supabase Query Tool Started");
  console.log("==============================");
  console.log(`📍 Connected to: ${supabaseUrl}`);
  console.log('Type "help" for available commands\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "supabase> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    const parts = input.split(" ");
    const command = parts[0].toLowerCase();

    switch (command) {
      case "help":
        printHelp();
        break;

      case "schema":
        printSchema();
        break;

      case "tables":
        console.log(`📋 Available tables: ${Object.keys(SCHEMA).join(", ")}`);
        break;

      case "describe":
        if (parts[1]) {
          describeTable(parts[1]);
        } else {
          console.log("❌ Usage: describe <table_name>");
        }
        break;

      case "sample":
        if (parts[1] && SCHEMA[parts[1]]) {
          console.log(`💡 Sample query for ${parts[1]}:`);
          console.log(`   ${SCHEMA[parts[1]].sample_query}`);
        } else {
          console.log("❌ Usage: sample <table_name>");
        }
        break;

      case "query":
        if (parts.length >= 3) {
          const tableName = parts[1];
          const queryString = parts.slice(2).join(" ");
          await runQuery(tableName, queryString);
        } else {
          console.log("❌ Usage: query <table> <query_string>");
          console.log(
            '💡 Example: query posts select("id, title").eq("status", "published")'
          );
        }
        break;

      case "count":
        if (parts[1]) {
          await countRecords(parts[1]);
        } else {
          console.log("❌ Usage: count <table_name>");
        }
        break;

      case "exit":
      case "quit":
        console.log("👋 Goodbye!");
        rl.close();
        return;

      case "":
        // Empty line, do nothing
        break;

      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('💡 Type "help" for available commands');
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log("\n👋 Query tool closed");
    process.exit(0);
  });
}

startQueryTool();
