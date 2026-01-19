# Auto-Publish Scheduled Posts - Setup Guide

This Supabase Edge Function automatically publishes scheduled posts when their scheduled time has passed.

## Prerequisites

1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
2. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`

## Deployment

```bash
# Deploy the function
supabase functions deploy publish-scheduled-posts

# Set the function to be publicly accessible (for cron)
supabase functions update publish-scheduled-posts --no-verify-jwt
```

## Setting Up Automatic Cron Job

### Option 1: Using pg_cron (Recommended)

1. Enable pg_cron extension in Supabase Dashboard → Database → Extensions
2. Run this SQL in the SQL Editor:

```sql
-- Create a cron job that runs every minute
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/publish-scheduled-posts',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your Supabase anon key

### Option 2: External Cron Service

Use services like:
- **cron-job.org** (free)
- **GitHub Actions** (free for public repos)
- **Vercel Cron** (if using Vercel)

Set up a cron job to hit:
```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/publish-scheduled-posts
```

With header:
```
Authorization: Bearer YOUR_ANON_KEY
```

## Testing

```bash
# Test the function locally
supabase functions serve publish-scheduled-posts --env-file .env.local

# Call it manually
curl -X POST http://localhost:54321/functions/v1/publish-scheduled-posts
```

## Monitoring

View function logs in Supabase Dashboard → Edge Functions → Logs
