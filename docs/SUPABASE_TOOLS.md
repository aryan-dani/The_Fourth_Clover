# Supabase Local Development Tools

This repository now includes several tools to help you work with your Supabase database locally and write queries efficiently.

## 🗃️ Database Schema (Current)

Based on inspection of your live Supabase project:

### Profiles Table

- `id` (string) - User ID from auth.users
- `username` (string) - Unique username
- `full_name` (string|null) - Full name
- `bio` (string|null) - User bio
- `avatar_url` (string|null) - Profile picture URL
- `website` (string|null) - Personal website
- `twitter` (string|null) - Twitter handle
- `github` (string|null) - GitHub username
- `created_at` (timestamp) - Account creation
- `updated_at` (timestamp) - Last update

### Posts Table

- `id` (string) - Unique post ID
- `title` (string) - Post title
- `slug` (string) - URL slug
- `content` (string) - Post content
- `excerpt` (string|null) - Post excerpt
- `featured_image` (string|null) - Featured image URL
- `cover_image` (string|null) - Cover image URL
- `author_id` (string) - References profiles.id
- `status` (string) - 'draft' | 'published'
- `tags` (string[]|null) - Array of tags
- `read_time` (number) - Estimated reading time
- `created_at` (timestamp) - Creation date
- `updated_at` (timestamp) - Last update
- `published_at` (timestamp|null) - Publication date

## 🛠️ Available Tools

### 1. Web Query Builder (`/query`)

**URL**: `https://fourthclover.bio/query`

A beautiful web interface for building and testing Supabase queries:

- Visual table selection
- Interactive query builder
- Real-time results
- Query history
- Sample queries
- Schema explorer

### 2. Terminal Query Tool

**Command**: `node query-tool.js`

An interactive terminal interface for running queries:

```bash
node query-tool.js

# Available commands:
# help - Show help
# schema - Show database schema
# tables - List tables
# describe <table> - Show table structure
# query <table> <query> - Run Supabase query
# count <table> - Count records
# exit - Exit tool
```

### 3. Schema Inspector

**Command**: `node inspect-schema.js`

Automatically inspect and document your current database structure:

```bash
node inspect-schema.js
```

### 4. Connection Verifier

**Command**: `node verify-supabase.js`

Quick connection test for your Supabase project:

```bash
node verify-supabase.js
```

## 📚 Code Libraries

### Database Types (`lib/database-types.ts`)

TypeScript interfaces for your database tables:

```typescript
import type { Profile, Post, PostFilters } from "./lib/database-types";
```

### Database Operations (`lib/database-operations.ts`)

Pre-built functions for common database operations:

```typescript
import {
  DatabaseOperations,
  getPublishedPosts,
  getUserPosts,
} from "./lib/database-operations";

// Get published posts
const { data: posts } = await getPublishedPosts(10);

// Get user's posts
const { data: userPosts } = await getUserPosts(userId, "published");

// Search posts
const { data: searchResults } = await DatabaseOperations.searchPosts("react");
```

## 🚀 Quick Start Examples

### Get All Published Posts

```javascript
// Terminal query tool
> query posts select('id, title, status').eq('status', 'published')

// In your React component
import { getPublishedPosts } from '../lib/database-operations';

const { data: posts } = await getPublishedPosts(20);
```

### Get User Profile

```javascript
// Terminal query tool
> query profiles select('*').eq('username', 'your_username')

// In your React component
import { getProfileByUsername } from '../lib/database-operations';

const { data: profile } = await getProfileByUsername('username');
```

### Search Posts by Title

```javascript
// Terminal query tool
> query posts select('*').ilike('title', '%search_term%')

// In your React component
import { DatabaseOperations } from '../lib/database-operations';

const { data: results } = await DatabaseOperations.searchPosts('search_term');
```

## 📊 Current Data Summary

Your Supabase project currently contains:

- **1 Profile**: User "Aryan Dani"
- **1 Post**: Published post titled "h"

## 🔗 Useful Links

- **Web Query Builder**: https://fourthclover.bio/query
- **Connection Test**: https://fourthclover.bio/test-connection
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Your Project**: https://fntnxpwxuxtztyqoiika.supabase.co

## 💡 Pro Tips

1. **Use the web query builder** (`/query`) for experimenting with complex queries
2. **Use the terminal tool** for quick data checks during development
3. **Import database operations** in your components instead of writing raw Supabase queries
4. **Check the schema types** for TypeScript autocomplete and type safety
5. **Run the connection verifier** if you encounter any issues

## 🔄 Next Steps

1. Explore your data using the query tools
2. Import the database operations in your existing components
3. Use the TypeScript types for better development experience
4. Consider adding more sample data to test with

Happy querying! 🎉
