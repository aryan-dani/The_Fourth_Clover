-- Add admin role to profiles for Phase 4: Admin Panel
-- Run this in your Supabase SQL Editor

-- Add is_admin column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN profiles.is_admin IS 'Whether the user has admin privileges';

-- IMPORTANT: Set yourself as admin by running this with your actual user ID:
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'YOUR_USER_ID';
-- 
-- To find your user ID, go to Authentication > Users in Supabase dashboard
