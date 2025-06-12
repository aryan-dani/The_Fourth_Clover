/*
  # Create posts table

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `slug` (text, unique)
      - `content` (text)
      - `excerpt` (text, nullable)
      - `cover_image` (text, nullable)
      - `status` (enum: draft, published)
      - `author_id` (uuid, references auth.users)
      - `tags` (text array, nullable)
      - `read_time` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `published_at` (timestamp, nullable)

  2. Security
    - Enable RLS on `posts` table
    - Add policy for everyone to read published posts
    - Add policy for authors to manage their own posts
*/

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_image text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  tags text[] DEFAULT '{}',
  read_time integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are viewable by everyone"
  ON posts
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authors can view their own posts"
  ON posts
  FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert their own posts"
  ON posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON posts
  FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts"
  ON posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Create function to set published_at when status changes to published
CREATE OR REPLACE FUNCTION handle_post_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status = 'draft' THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_post_published_trigger
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE PROCEDURE handle_post_published();