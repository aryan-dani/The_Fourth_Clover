-- Migration: Add publications, publication_members, and CSI review workflow
-- Note: Inline post images reuse the existing 'post-images' bucket under '{userId}/inline/...'.
-- No listing SELECT policies are added on public storage buckets.

-- 1. Create publications table
CREATE TABLE IF NOT EXISTS public.publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  cover_image text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create publication_members table
CREATE TABLE IF NOT EXISTS public.publication_members (
  publication_id uuid NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('writer', 'editor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (publication_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_publication_members_user_id
  ON public.publication_members(user_id);

CREATE INDEX IF NOT EXISTS idx_publication_members_pub_role
  ON public.publication_members(publication_id, role);

-- 3. Extend posts table with publication_id, review_note, and 'in_review' status
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS publication_id uuid REFERENCES public.publications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_note text;

DO $$
DECLARE
  con_name text;
BEGIN
  FOR con_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'posts'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS %I', con_name);
  END LOOP;
END $$;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'in_review', 'published'));

CREATE INDEX IF NOT EXISTS idx_posts_publication_status_pub_at
  ON public.posts(publication_id, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_publication_status_upd_at
  ON public.posts(publication_id, status, updated_at DESC);

-- 4. Extend notifications type check constraint for review notifications
DO $$
DECLARE
  con_name text;
BEGIN
  FOR con_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'notifications'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%type%'
  LOOP
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS %I', con_name);
  END LOOP;
END $$;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (
    type IN (
      'like',
      'comment',
      'reply',
      'follow',
      'review_submitted',
      'review_approved',
      'changes_requested'
    )
  );

-- 5. Helper functions for RLS and role verification
CREATE OR REPLACE FUNCTION public.is_admin_user(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = uid),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_publication_member(pub_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.publication_members
    WHERE publication_id = pub_id
      AND user_id = uid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_publication_editor(pub_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.publication_members
    WHERE publication_id = pub_id
      AND user_id = uid
      AND role = 'editor'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_publication_member(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_publication_editor(uuid, uuid) TO anon, authenticated;

-- 6. Trigger to enforce publication membership and writer/editor transition rules
CREATE OR REPLACE FUNCTION public.enforce_publication_post_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_is_admin boolean;
  caller_is_member boolean;
  caller_is_editor boolean;
BEGIN
  -- Allow service_role or SQL migrations where auth.uid() is null
  IF caller_id IS NULL THEN
    RETURN NEW;
  END IF;

  caller_is_admin := public.is_admin_user(caller_id);
  IF caller_is_admin THEN
    RETURN NEW;
  END IF;

  -- Non-publication posts cannot use 'in_review' status
  IF NEW.publication_id IS NULL THEN
    IF NEW.status = 'in_review' THEN
      RAISE EXCEPTION 'Personal posts cannot be set to in_review without a publication.';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.author_id <> caller_id THEN
      RAISE EXCEPTION 'You can only create posts under your own author_id.';
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.author_id <> caller_id THEN
      RAISE EXCEPTION 'You can only update your own posts.';
    END IF;
    RETURN NEW;
  END IF;

  -- Publication posts: check membership and editor role
  caller_is_member := public.is_publication_member(NEW.publication_id, caller_id);
  caller_is_editor := public.is_publication_editor(NEW.publication_id, caller_id);

  IF NOT caller_is_member THEN
    RAISE EXCEPTION 'Only members of this publication can create or update posts in it.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.author_id <> caller_id THEN
      RAISE EXCEPTION 'You can only create posts as yourself.';
    END IF;
    IF NEW.status = 'published' AND NOT caller_is_editor THEN
      RAISE EXCEPTION 'Writers cannot publish directly. Submit the post for review instead.';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.author_id <> OLD.author_id THEN
      RAISE EXCEPTION 'Cannot change post author_id.';
    END IF;

    IF OLD.author_id = caller_id THEN
      IF NEW.status = 'published' AND NOT caller_is_editor THEN
        RAISE EXCEPTION 'Writers cannot publish directly. Submit the post for review instead.';
      END IF;
    ELSE
      IF NOT caller_is_editor THEN
        RAISE EXCEPTION 'Only publication editors can review or update other members posts.';
      END IF;
      IF OLD.status <> 'in_review' AND OLD.status <> 'published' THEN
        RAISE EXCEPTION 'Editors can only review posts that have been submitted for review.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_publication_post_rules ON public.posts;
CREATE TRIGGER trg_enforce_publication_post_rules
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_publication_post_rules();

-- 7. Enable RLS and configure policies
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Grants for PostgREST roles
GRANT SELECT ON public.publications, public.publication_members TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.publications, public.publication_members TO authenticated;

-- publications policies
DROP POLICY IF EXISTS "Publications are viewable by everyone" ON public.publications;
CREATE POLICY "Publications are viewable by everyone"
  ON public.publications
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert publications" ON public.publications;
CREATE POLICY "Admins can insert publications"
  ON public.publications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update publications" ON public.publications;
CREATE POLICY "Admins can update publications"
  ON public.publications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete publications" ON public.publications;
CREATE POLICY "Admins can delete publications"
  ON public.publications
  FOR DELETE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- publication_members policies
DROP POLICY IF EXISTS "Publication members are viewable by everyone" ON public.publication_members;
CREATE POLICY "Publication members are viewable by everyone"
  ON public.publication_members
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert publication members" ON public.publication_members;
CREATE POLICY "Admins can insert publication members"
  ON public.publication_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update publication members" ON public.publication_members;
CREATE POLICY "Admins can update publication members"
  ON public.publication_members
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete publication members" ON public.publication_members;
CREATE POLICY "Admins can delete publication members"
  ON public.publication_members
  FOR DELETE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- posts policies for publication review
DROP POLICY IF EXISTS "Editors can view in_review posts for their publication" ON public.posts;
CREATE POLICY "Editors can view in_review posts for their publication"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (
    publication_id IS NOT NULL
    AND status = 'in_review'
    AND public.is_publication_editor(publication_id, auth.uid())
  );

DROP POLICY IF EXISTS "Editors can review and update in_review posts for their publication" ON public.posts;
CREATE POLICY "Editors can review and update in_review posts for their publication"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (
    publication_id IS NOT NULL
    AND status = 'in_review'
    AND public.is_publication_editor(publication_id, auth.uid())
  )
  WITH CHECK (
    publication_id IS NOT NULL
    AND public.is_publication_editor(publication_id, auth.uid())
    AND status IN ('draft', 'in_review', 'published')
  );

-- Restrictive policy on posts to guarantee writers cannot self-publish and anon cannot read non-published posts
DROP POLICY IF EXISTS "Enforce publication membership and review workflow" ON public.posts;
CREATE POLICY "Enforce publication membership and review workflow"
  ON public.posts
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (
    status = 'published'
    OR author_id = auth.uid()
    OR public.is_admin_user(auth.uid())
    OR (
      publication_id IS NOT NULL
      AND status = 'in_review'
      AND public.is_publication_editor(publication_id, auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin_user(auth.uid())
    OR (
      publication_id IS NULL
      AND author_id = auth.uid()
      AND status IN ('draft', 'published')
    )
    OR (
      publication_id IS NOT NULL
      AND author_id = auth.uid()
      AND public.is_publication_member(publication_id, auth.uid())
      AND (
        status IN ('draft', 'in_review')
        OR (status = 'published' AND public.is_publication_editor(publication_id, auth.uid()))
      )
    )
    OR (
      publication_id IS NOT NULL
      AND public.is_publication_editor(publication_id, auth.uid())
      AND status IN ('draft', 'in_review', 'published')
    )
  );

-- 8. Seed the "csi" publication
INSERT INTO public.publications (slug, name, description, cover_image)
VALUES (
  'csi',
  'CSI Tech Blog',
  'Technical deep-dives, tutorials, and engineering explainers written by CSI MIT-WPU technical members.',
  NULL
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SQL Snippet: Adding CSI Editors (Technical Lead / Technical Secretary) and Writers
-- Run in the Supabase SQL Editor (or manage via the /admin page):
--
-- 1) Add an Editor by username:
-- INSERT INTO public.publication_members (publication_id, user_id, role)
-- SELECT pub.id, prof.id, 'editor'
-- FROM public.publications pub
-- CROSS JOIN public.profiles prof
-- WHERE pub.slug = 'csi' AND prof.username = 'replace_with_editor_username'
-- ON CONFLICT (publication_id, user_id) DO UPDATE SET role = EXCLUDED.role;
--
-- 2) Add a Writer (technical member) by username:
-- INSERT INTO public.publication_members (publication_id, user_id, role)
-- SELECT pub.id, prof.id, 'writer'
-- FROM public.publications pub
-- CROSS JOIN public.profiles prof
-- WHERE pub.slug = 'csi' AND prof.username = 'replace_with_writer_username'
-- ON CONFLICT (publication_id, user_id) DO UPDATE SET role = EXCLUDED.role;
-- ============================================================================
