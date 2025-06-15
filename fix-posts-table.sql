-- Simple fix for missing cover_image column
-- Run this in your Supabase SQL Editor

-- Add the missing cover_image column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Also add other potentially missing columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS read_time INTEGER DEFAULT 1;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
