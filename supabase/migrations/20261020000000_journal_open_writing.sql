-- Migration: Open Journal writing for any non-suspended author,
-- posts.format, bookmarks, search_content RPC, and role backfill.

-- ============================================================================
-- 1. OPEN JOURNAL WRITING (RLS + TRIGGER)
-- ============================================================================

-- Allow Journal (publication_id IS NULL) writes for any non-suspended author.
-- Keep tech publication_id path requiring verified tech membership / tech head.
DROP POLICY IF EXISTS "Enforce publication membership and review workflow" ON public.posts;
CREATE POLICY "Enforce publication membership and review workflow"
  ON public.posts
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (
    status = 'published'
    OR (publication_id IS NOT NULL AND status = 'in_review')
    OR author_id = auth.uid()
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      -- Journal: any signed-in non-suspended author may draft/publish
      publication_id IS NULL
      AND author_id = auth.uid()
      AND status IN ('draft', 'published')
      AND NOT COALESCE(
        (SELECT is_suspended FROM public.profiles WHERE id = auth.uid()),
        true
      )
    )
    OR (
      -- Tech publication path (unchanged membership requirements)
      public.is_verified_tech_member(auth.uid())
      AND (
        (
          publication_id IS NOT NULL
          AND author_id = auth.uid()
          AND (
            status IN ('draft', 'in_review')
            OR (status = 'published' AND public.is_tech_head_or_admin(auth.uid()))
          )
        )
        OR (
          publication_id IS NOT NULL
          AND public.is_tech_head_or_admin(auth.uid())
          AND status IN ('draft', 'in_review', 'published')
        )
      )
    )
  );

-- Align trigger with open Journal writing (RLS alone is not enough).
CREATE OR REPLACE FUNCTION public.enforce_publication_post_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_is_admin boolean;
  caller_is_tech boolean;
  caller_is_editor boolean;
  caller_suspended boolean;
  existing_pick_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RETURN NEW;
  END IF;

  caller_is_admin := public.is_super_admin(caller_id);
  IF caller_is_admin THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(is_suspended, false) INTO caller_suspended
  FROM public.profiles
  WHERE id = caller_id;

  IF COALESCE(caller_suspended, true) THEN
    RAISE EXCEPTION 'Your account is currently suspended.';
  END IF;

  -- Journal posts (no publication): any non-suspended author
  IF NEW.publication_id IS NULL THEN
    IF NEW.status = 'in_review' THEN
      RAISE EXCEPTION 'Personal posts cannot be set to in_review without a publication.';
    END IF;
    IF NEW.linkedin_pick_week IS NOT NULL THEN
      RAISE EXCEPTION 'Only publication posts can be selected as a CSI Weekly LinkedIn Pick.';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.author_id <> caller_id THEN
      RAISE EXCEPTION 'You can only create posts under your own author_id.';
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.author_id <> caller_id THEN
      RAISE EXCEPTION 'You can only update your own posts.';
    END IF;
    IF NEW.status NOT IN ('draft', 'published') THEN
      RAISE EXCEPTION 'Journal posts must be draft or published.';
    END IF;
    RETURN NEW;
  END IF;

  -- Tech / publication posts: verified tech members only
  caller_is_tech := public.is_verified_tech_member(caller_id);
  IF NOT caller_is_tech THEN
    RAISE EXCEPTION 'Unauthorized: only verified CSI Technical members can create or update publication posts.';
  END IF;

  caller_is_editor := public.is_tech_head_or_admin(caller_id) OR public.is_publication_editor(NEW.publication_id, caller_id);

  IF TG_OP = 'INSERT' AND NEW.linkedin_pick_week IS NOT NULL AND NOT caller_is_editor THEN
    RAISE EXCEPTION 'Only CSI Technical Heads or Super Admins can select the Weekly LinkedIn Pick.';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.linkedin_pick_week IS DISTINCT FROM OLD.linkedin_pick_week THEN
    IF NOT caller_is_editor THEN
      RAISE EXCEPTION 'Only CSI Technical Heads or Super Admins can select the Weekly LinkedIn Pick.';
    END IF;

    IF NEW.linkedin_pick_week IS NOT NULL THEN
      SELECT id INTO existing_pick_id
      FROM public.posts
      WHERE publication_id = NEW.publication_id
        AND linkedin_pick_week = NEW.linkedin_pick_week
        AND id <> NEW.id
      LIMIT 1;

      IF existing_pick_id IS NOT NULL THEN
        RAISE EXCEPTION 'A Weekly LinkedIn Pick has already been selected for week %. Only one post per week is allowed.', NEW.linkedin_pick_week;
      END IF;
    END IF;
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
        RAISE EXCEPTION 'Only Technical Heads or Super Admin can review or update other members posts.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. POSTS.FORMAT (prose | poetry)
-- ============================================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'prose';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'posts'
      AND c.conname = 'posts_format_check'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_format_check
      CHECK (format IN ('prose', 'poetry'));
  END IF;
END $$;

-- ============================================================================
-- 3. BOOKMARKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post', 'tech_submission')),
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created
  ON public.bookmarks(user_id, created_at DESC);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 4. SEARCH_CONTENT RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_content(q text, lim int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  kind text,
  excerpt text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH qn AS (
    SELECT NULLIF(trim(q), '') AS term,
           GREATEST(1, LEAST(COALESCE(lim, 20), 40)) AS row_limit
  ),
  post_hits AS (
    SELECT
      p.id,
      p.title,
      p.slug,
      'journal'::text AS kind,
      p.excerpt
    FROM public.posts p, qn
    WHERE qn.term IS NOT NULL
      AND p.status = 'published'
      AND (
        p.title ILIKE '%' || qn.term || '%'
        OR COALESCE(p.excerpt, '') ILIKE '%' || qn.term || '%'
      )
    ORDER BY p.published_at DESC NULLS LAST
    LIMIT (SELECT row_limit FROM qn)
  ),
  tech_hits AS (
    SELECT
      t.id,
      t.title,
      t.slug,
      'tech'::text AS kind,
      t.summary AS excerpt
    FROM public.tech_submissions t, qn
    WHERE qn.term IS NOT NULL
      AND t.is_deleted = false
      AND t.status IN ('submitted', 'approved', 'selected', 'archived')
      AND (
        t.title ILIKE '%' || qn.term || '%'
        OR COALESCE(t.summary, '') ILIKE '%' || qn.term || '%'
      )
    ORDER BY t.created_at DESC
    LIMIT (SELECT row_limit FROM qn)
  )
  SELECT * FROM post_hits
  UNION ALL
  SELECT * FROM tech_hits
  LIMIT (SELECT row_limit FROM qn);
$$;

GRANT EXECUTE ON FUNCTION public.search_content(text, int) TO anon, authenticated;

-- ============================================================================
-- 5. ROLE BACKFILL BY CSI ID
-- ============================================================================

UPDATE public.profiles
SET role = CASE csi_id
  WHEN 303 THEN 'super_admin'
  WHEN 241 THEN 'tech_head'
  WHEN 246 THEN 'tech_head'
  ELSE role
END,
is_admin = CASE WHEN csi_id = 303 THEN true ELSE is_admin END
WHERE csi_id IN (241, 246, 303);
