-- Add scheduled_at field to posts table for post scheduling feature

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN posts.scheduled_at IS 'Timestamp when the post should be automatically published';

-- Create index for efficient querying of scheduled posts
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at 
ON posts(scheduled_at) 
WHERE status = 'draft' AND scheduled_at IS NOT NULL;
