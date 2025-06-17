// Quick Supabase Connection Test
"use client";
import { supabase } from "../../lib/supabase";
import { useState } from "react";

export default function TestConnection() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults((prev) => [...prev, message]);
    console.log(message);
  };

  const testConnection = async () => {
    setTestResults([]);
    addResult("🔍 Starting Supabase connection test...");

    try {
      // Test 1: Basic connection and auth service
      addResult("📡 Testing basic connection...");
      const { data: session, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        addResult(`❌ Auth service error: ${sessionError.message}`);
      } else {
        addResult("✅ Auth service connection successful!");
        addResult(`📍 Project URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      }

      // Test 2: Database connection - profiles table
      addResult("🗄️ Testing profiles table access...");
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (profilesError) {
        addResult(`⚠️ Profiles table: ${profilesError.message}`);
        if (
          profilesError.message.includes(
            'relation "public.profiles" does not exist'
          )
        ) {
          addResult(
            "� Need to create database tables - check supabase-setup.sql"
          );
        }
      } else {
        addResult("✅ Profiles table accessible!");
        addResult(`📊 Found ${profilesData?.length || 0} profile records`);
      }

      // Test 3: Database connection - posts table
      addResult("📝 Testing posts table access...");
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, title")
        .limit(1);

      if (postsError) {
        addResult(`⚠️ Posts table: ${postsError.message}`);
        if (
          postsError.message.includes('relation "public.posts" does not exist')
        ) {
          addResult(
            "💡 Need to create database tables - check supabase-setup.sql"
          );
        }
      } else {
        addResult("✅ Posts table accessible!");
        addResult(`📊 Found ${postsData?.length || 0} post records`);
      }

      // Test 4: Real-time subscription test
      addResult("⚡ Testing real-time capabilities...");
      const channel = supabase
        .channel("test-channel")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "posts" },
          (payload) => {
            addResult("📡 Real-time event received!");
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            addResult("✅ Real-time subscription active!");
          } else if (status === "CLOSED") {
            addResult("🔌 Real-time subscription closed");
          } else {
            addResult(`📡 Real-time status: ${status}`);
          }
        });

      // Clean up subscription after 3 seconds
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 3000);

      addResult("🎉 Connection test completed!");
    } catch (err) {
      addResult(`❌ Unexpected error: ${err}`);
    }
  };
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>

      <div className="mb-6">
        <button
          onClick={testConnection}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          🔍 Test Supabase Connection
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Results */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className="text-sm font-mono bg-white p-2 rounded border"
              >
                {result}
              </div>
            ))}
            {testResults.length === 0 && (
              <p className="text-gray-500 italic">
                Click the test button to start...
              </p>
            )}
          </div>
        </div>

        {/* Connection Info */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Connection Info</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Project URL:
              </label>
              <p className="text-sm font-mono bg-white p-2 rounded border break-all">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not configured"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Anon Key (first 20 chars):
              </label>
              <p className="text-sm font-mono bg-white p-2 rounded border">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) ||
                  "Not configured"}
                ...
              </p>
            </div>
            <div className="mt-4 p-4 bg-yellow-100 rounded border-l-4 border-yellow-500">
              <h3 className="font-medium text-yellow-800">
                Setup Instructions:
              </h3>
              <ol className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>
                  1. Go to{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    className="underline"
                  >
                    Supabase Dashboard
                  </a>
                </li>
                <li>2. Select your project</li>
                <li>3. Go to Settings → API</li>
                <li>4. Copy your URL and anon key to .env.local</li>
                <li>5. Run the SQL script in supabase-setup.sql</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
