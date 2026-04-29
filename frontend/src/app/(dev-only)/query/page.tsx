"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

interface QueryResult {
  table: string;
  query: string;
  data: any[];
  count?: number;
  timestamp: string;
  recordCount: number;
}

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
    samples: [
      "select('id, username, full_name')",
      "select('*').eq('username', 'your_username')",
      "select('username, bio').not('bio', 'is', null)",
      "select('count', { count: 'exact' })",
    ],
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
    samples: [
      "select('id, title, status, created_at')",
      "select('*').eq('status', 'published')",
      "select('title, author_id').order('created_at', { ascending: false })",
      "select('*').contains('tags', ['technology'])",
      "select('count', { count: 'exact' })",
    ],
  },
  categories: {
    columns: ["id", "name", "slug", "description", "created_at"],
    samples: [
      "select('id, name, slug')",
      "select('*').order('name')",
      "select('*').ilike('name', '%tech%')",
      "select('count', { count: 'exact' })",
    ],
  },
  post_categories: {
    columns: ["post_id", "category_id"],
    samples: [
      "select('*')",
      "select('*').eq('post_id', 'your_post_id')",
      "select('*').eq('category_id', 'your_category_id')",
      "select('count', { count: 'exact' })",
    ],
  },
  comments: {
    columns: [
      "id",
      "content",
      "author_id",
      "post_id",
      "parent_id",
      "created_at",
      "updated_at",
    ],
    samples: [
      "select('id, content, author_id, created_at')",
      "select('*').eq('post_id', 'your_post_id')",
      "select('*').is('parent_id', null)",
      "select('*').not('parent_id', 'is', null)",
    ],
  },
  likes: {
    columns: ["id", "user_id", "post_id", "created_at"],
    samples: [
      "select('*')",
      "select('*').eq('post_id', 'your_post_id')",
      "select('*').eq('user_id', 'your_user_id')",
      "select('count', { count: 'exact' })",
    ],
  },
} as const;

type TableName = keyof typeof SCHEMA;

export default function QueryBuilder() {
  const [selectedTable, setSelectedTable] = useState<TableName>("profiles");
  const [queryString, setQueryString] = useState(
    "select('id, username, full_name')"
  );
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);

  const executeQuery = async () => {
    if (!queryString.trim()) {
      setError("Please enter a query");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(
        `Executing: supabase.from('${selectedTable}').${queryString}`
      );

      // Build and execute the query
      let query = supabase.from(selectedTable);
      const result = eval(`query.${queryString}`);

      const { data, error: queryError, count } = await result;

      if (queryError) {
        throw new Error(queryError.message);
      }

      const queryResult = {
        table: selectedTable,
        query: queryString,
        data,
        count,
        timestamp: new Date().toISOString(),
        recordCount: data?.length || 0,
      };

      setResults(queryResult);
      setQueryHistory((prev) => [queryResult, ...prev.slice(0, 9)]); // Keep last 10 queries
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Query error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleQuery = (sample: string) => {
    setQueryString(sample);
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background p-8 text-foreground max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Query Builder</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Table Selection */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Select Table</h2>{" "}
            <div className="flex space-x-4">
              {(Object.keys(SCHEMA) as TableName[]).map((table) => (
                <button
                  key={table}
                  onClick={() => setSelectedTable(table)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    selectedTable === table
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {table}
                </button>
              ))}
            </div>
          </div>

          {/* Query Builder */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Build Query</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Query for table:{" "}
                  <span className="font-mono text-primary">
                    {selectedTable}
                  </span>
                </label>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                  <span className="font-mono">
                    supabase.from(&apos;{selectedTable}&apos;).
                  </span>
                </div>
                <textarea
                  value={queryString}
                  onChange={(e) => setQueryString(e.target.value)}
                  className="w-full h-24 p-3 border border-border rounded-md font-mono text-sm bg-background text-foreground"
                  placeholder="select('*')"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={executeQuery}
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium"
                >
                  {loading ? "⏳ Running..." : "▶ Execute Query"}
                </button>
                <button
                  onClick={clearResults}
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {(results || error) && (
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Query Results</h2>

              {error && (
                <div className="bg-destructive/10 border border-destructive/25 rounded-md p-4 mb-4">
                  <div className="text-destructive font-medium">Query Error:</div>
                  <div className="text-destructive/90 text-sm mt-1">{error}</div>
                </div>
              )}

              {results && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Found {results.recordCount} records</span>
                    <span>{new Date(results.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="bg-muted/50 rounded-md p-4 max-h-96 overflow-auto">
                    <pre className="text-sm">
                      {JSON.stringify(results.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schema Info */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Table Schema</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-primary">
                  {selectedTable}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({SCHEMA[selectedTable].columns.length} columns)
                </span>
              </div>
              <div className="text-sm space-y-1">
                {SCHEMA[selectedTable].columns.map((col) => (
                  <div key={col} className="font-mono text-foreground">
                    • {col}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sample Queries */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Sample Queries</h2>
            <div className="space-y-2">
              {SCHEMA[selectedTable].samples.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => loadSampleQuery(sample)}
                  className="w-full text-left p-3 bg-muted/40 hover:bg-muted rounded-md transition-colors"
                >
                  <div className="font-mono text-sm text-foreground">
                    {sample}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Query History */}
          {queryHistory.length > 0 && (
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Recent Queries</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {queryHistory.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedTable(query.table as TableName);
                      setQueryString(query.query);
                    }}
                    className="w-full text-left p-2 bg-muted/40 hover:bg-muted rounded text-xs"
                  >
                    <div className="font-mono text-foreground truncate">
                      {query.table}: {query.query}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {query.recordCount} records •{" "}
                      {new Date(query.timestamp).toLocaleTimeString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
