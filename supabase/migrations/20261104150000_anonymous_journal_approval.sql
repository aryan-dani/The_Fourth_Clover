-- Migration: Anonymous Journal posts with admin approval.
-- Writers may submit journal pieces without a public name (status in_review).
-- Super admins approve; on publish the real author is stored privately and
-- posts.author_id is rewritten to a suspended system "Anonymous" profile.

-- ============================================================================
-- 1. COLUMN + ANONYMOUS SYSTEM ACCOUNT
-- ============================================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_anonymous_in_review
  ON public.posts (status, created_at DESC)
  WHERE is_anonymous = true AND publication_id IS NULL;

DO $$
DECLARE
  v_anon_id uuid := 'a0000000-0000-4000-8000-0000000000a1';
  v_anon_email text := 'anonymous@thefourthclover.internal';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_anon_id OR email = v_anon_email) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_anon_id,
      'authenticated',
      'authenticated',
      v_anon_email,
      extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"anonymous","full_name":"Anonymous"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_anon_id,
      jsonb_build_object('sub', v_anon_id::text, 'email', v_anon_email, 'email_verified', true),
      'email',
      v_anon_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    SELECT id INTO v_anon_id FROM auth.users WHERE email = v_anon_email OR id = v_anon_id LIMIT 1;
  END IF;

  INSERT INTO public.profiles (
    id, username, full_name, bio, is_admin, role, is_suspended, created_at, updated_at
  ) VALUES (
    v_anon_id,
    'anonymous',
    'Anonymous',
    'System profile for approved anonymous Journal posts.',
    false,
    'unverified',
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET username = 'anonymous',
      full_name = 'Anonymous',
      is_suspended = true,
      is_admin = false,
      updated_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.journal_anonymous_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE username = 'anonymous' LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.journal_anonymous_profile_id() TO anon, authenticated;

-- ============================================================================
-- 2. PRIVATE ATTRIBUTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.journal_anonymous_authors (
  post_id uuid PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_anonymous_authors_author
  ON public.journal_anonymous_authors (author_id);

ALTER TABLE public.journal_anonymous_authors ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.journal_anonymous_authors FROM anon, authenticated;
GRANT SELECT ON public.journal_anonymous_authors TO authenticated;

CREATE OR REPLACE FUNCTION public.is_journal_anonymous_author(p_post_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.journal_anonymous_authors j
    WHERE j.post_id = p_post_id
      AND j.author_id = p_uid
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_journal_anonymous_author(uuid, uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Authors and super admins can view journal anonymous attribution"
  ON public.journal_anonymous_authors;
CREATE POLICY "Authors and super admins can view journal anonymous attribution"
  ON public.journal_anonymous_authors
  FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_super_admin(auth.uid())
  );

-- No INSERT/UPDATE/DELETE policies for authenticated: only SECURITY DEFINER
-- trigger / admin RPC paths write attribution rows.

-- ============================================================================
-- 3. RLS: RESTRICTIVE POSTS POLICY
-- ============================================================================

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
    OR public.is_journal_anonymous_author(id, auth.uid())
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      -- Journal: signed-in non-suspended author (pre-mask ownership)
      publication_id IS NULL
      AND author_id = auth.uid()
      AND NOT COALESCE(
        (SELECT is_suspended FROM public.profiles WHERE id = auth.uid()),
        true
      )
      AND (
        (COALESCE(is_anonymous, false) = false AND status IN ('draft', 'published'))
        OR (COALESCE(is_anonymous, false) = true AND status IN ('draft', 'in_review'))
      )
    )
    OR (
      -- Journal: real author updating a published anonymous post after mask
      publication_id IS NULL
      AND COALESCE(is_anonymous, false) = true
      AND status = 'published'
      AND author_id = public.journal_anonymous_profile_id()
      AND public.is_journal_anonymous_author(id, auth.uid())
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

-- ============================================================================
-- 4. TRIGGER: JOURNAL ANONYMOUS RULES + AUTHOR MASK ON PUBLISH
-- ============================================================================

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
  v_anon_id uuid;
  v_real_author uuid;
  v_is_attributed boolean := false;
BEGIN
  v_anon_id := public.journal_anonymous_profile_id();

  -- Reject anonymous flag on publication posts
  IF NEW.publication_id IS NOT NULL AND COALESCE(NEW.is_anonymous, false) THEN
    RAISE EXCEPTION 'Anonymous posting is only available for Journal posts.';
  END IF;

  -- Mask real author when an anonymous journal post becomes (or stays) published.
  IF NEW.publication_id IS NULL
     AND COALESCE(NEW.is_anonymous, false)
     AND NEW.status = 'published'
     AND v_anon_id IS NOT NULL THEN
    SELECT j.author_id INTO v_real_author
    FROM public.journal_anonymous_authors j
    WHERE j.post_id = NEW.id;

    IF v_real_author IS NULL THEN
      IF NEW.author_id IS DISTINCT FROM v_anon_id THEN
        v_real_author := NEW.author_id;
      ELSIF TG_OP = 'UPDATE' AND OLD.author_id IS DISTINCT FROM v_anon_id THEN
        v_real_author := OLD.author_id;
      END IF;
    END IF;

    IF v_real_author IS NULL OR v_real_author = v_anon_id THEN
      RAISE EXCEPTION 'Cannot publish an anonymous Journal post without a real author.';
    END IF;

    INSERT INTO public.journal_anonymous_authors (post_id, author_id)
    VALUES (NEW.id, v_real_author)
    ON CONFLICT (post_id) DO UPDATE
    SET author_id = EXCLUDED.author_id;

    NEW.author_id := v_anon_id;
  END IF;

  -- Drop attribution when a piece is no longer anonymous (draft / in_review only)
  IF TG_OP = 'UPDATE'
     AND NEW.publication_id IS NULL
     AND COALESCE(NEW.is_anonymous, false) = false
     AND COALESCE(OLD.is_anonymous, false) = true
     AND NEW.status IN ('draft', 'in_review') THEN
    DELETE FROM public.journal_anonymous_authors WHERE post_id = NEW.id;
  END IF;

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

  -- Journal posts (no publication)
  IF NEW.publication_id IS NULL THEN
    IF NEW.linkedin_pick_week IS NOT NULL THEN
      RAISE EXCEPTION 'Only publication posts can be selected as a CSI Weekly LinkedIn Pick.';
    END IF;

    IF TG_OP = 'UPDATE' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.journal_anonymous_authors j
        WHERE j.post_id = NEW.id AND j.author_id = caller_id
      ) INTO v_is_attributed;
    END IF;

    IF TG_OP = 'INSERT' THEN
      IF NEW.author_id <> caller_id THEN
        RAISE EXCEPTION 'You can only create posts under your own author_id.';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.author_id <> caller_id AND NOT v_is_attributed THEN
        RAISE EXCEPTION 'You can only update your own posts.';
      END IF;
      IF NEW.author_id IS DISTINCT FROM OLD.author_id
         AND NOT (
           COALESCE(NEW.is_anonymous, false)
           AND NEW.status = 'published'
           AND NEW.author_id = v_anon_id
         ) THEN
        RAISE EXCEPTION 'Cannot change post author_id.';
      END IF;
    END IF;

    IF COALESCE(NEW.is_anonymous, false) THEN
      IF NEW.status = 'published' AND NOT v_is_attributed THEN
        -- Writers cannot self-publish anonymous posts; admins already returned.
        -- Attributed writers may keep a published anonymous post updated.
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'published') THEN
          RAISE EXCEPTION 'Anonymous Journal posts require admin approval before publishing.';
        END IF;
      END IF;
      IF NEW.status NOT IN ('draft', 'in_review', 'published') THEN
        RAISE EXCEPTION 'Invalid status for an anonymous Journal post.';
      END IF;
      IF NEW.status = 'published' AND COALESCE(NEW.is_anonymous, false) = false THEN
        RAISE EXCEPTION 'Cannot clear anonymity on a published anonymous Journal post.';
      END IF;
      IF TG_OP = 'UPDATE'
         AND OLD.status = 'published'
         AND COALESCE(OLD.is_anonymous, false)
         AND COALESCE(NEW.is_anonymous, false) = false THEN
        RAISE EXCEPTION 'Cannot clear anonymity on a published anonymous Journal post.';
      END IF;
      IF TG_OP = 'UPDATE'
         AND OLD.status = 'published'
         AND COALESCE(OLD.is_anonymous, false)
         AND NEW.status IS DISTINCT FROM 'published' THEN
        RAISE EXCEPTION 'Published anonymous Journal posts cannot be unpublished by the author.';
      END IF;
    ELSE
      IF NEW.status = 'in_review' THEN
        RAISE EXCEPTION 'Personal posts cannot be set to in_review without a publication.';
      END IF;
      IF NEW.status NOT IN ('draft', 'published') THEN
        RAISE EXCEPTION 'Journal posts must be draft or published.';
      END IF;
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
-- 5. ADMIN RPCs: APPROVE / SEND BACK ANONYMOUS JOURNAL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_approve_anonymous_journal_post(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_post public.posts%ROWTYPE;
  v_real_author uuid;
BEGIN
  IF v_caller IS NULL OR NOT public.is_super_admin(v_caller) THEN
    RAISE EXCEPTION 'Super Admin authorization required.';
  END IF;

  SELECT * INTO v_post FROM public.posts WHERE id = p_post_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found.';
  END IF;
  IF v_post.publication_id IS NOT NULL OR NOT COALESCE(v_post.is_anonymous, false) THEN
    RAISE EXCEPTION 'Not an anonymous Journal post.';
  END IF;
  IF v_post.status <> 'in_review' THEN
    RAISE EXCEPTION 'Only in-review anonymous Journal posts can be approved.';
  END IF;

  v_real_author := v_post.author_id;

  UPDATE public.posts
  SET status = 'published',
      published_at = COALESCE(published_at, now()),
      review_note = null,
      updated_at = now()
  WHERE id = p_post_id;

  INSERT INTO public.audit_log (
    actor_id, action, target_type, target_id, before_state, after_state
  ) VALUES (
    v_caller,
    'journal.anonymous_approve',
    'post',
    p_post_id::text,
    jsonb_build_object(
      'status', v_post.status,
      'author_id', v_real_author,
      'is_anonymous', true
    ),
    jsonb_build_object(
      'status', 'published',
      'author_id', public.journal_anonymous_profile_id(),
      'real_author_id', v_real_author,
      'is_anonymous', true
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_send_back_anonymous_journal_post(
  p_post_id uuid,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_post public.posts%ROWTYPE;
  v_clean_note text := NULLIF(trim(COALESCE(p_note, '')), '');
BEGIN
  IF v_caller IS NULL OR NOT public.is_super_admin(v_caller) THEN
    RAISE EXCEPTION 'Super Admin authorization required.';
  END IF;

  SELECT * INTO v_post FROM public.posts WHERE id = p_post_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found.';
  END IF;
  IF v_post.publication_id IS NOT NULL OR NOT COALESCE(v_post.is_anonymous, false) THEN
    RAISE EXCEPTION 'Not an anonymous Journal post.';
  END IF;
  IF v_post.status <> 'in_review' THEN
    RAISE EXCEPTION 'Only in-review anonymous Journal posts can be sent back.';
  END IF;

  UPDATE public.posts
  SET status = 'draft',
      published_at = null,
      review_note = v_clean_note,
      updated_at = now()
  WHERE id = p_post_id;

  INSERT INTO public.audit_log (
    actor_id, action, target_type, target_id, before_state, after_state
  ) VALUES (
    v_caller,
    'journal.anonymous_send_back',
    'post',
    p_post_id::text,
    jsonb_build_object(
      'status', v_post.status,
      'author_id', v_post.author_id,
      'is_anonymous', true
    ),
    jsonb_build_object(
      'status', 'draft',
      'author_id', v_post.author_id,
      'review_note', v_clean_note,
      'is_anonymous', true
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_anonymous_journal_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_back_anonymous_journal_post(uuid, text) TO authenticated;

-- ============================================================================
-- 6. SEARCH: HIDE SYSTEM ANONYMOUS PROFILE; DO NOT MATCH REAL AUTHORS ON ANON POSTS
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
  author_hits AS (
    SELECT
      p.id,
      COALESCE(NULLIF(trim(p.full_name), ''), p.username) AS title,
      p.username AS slug,
      'author'::text AS kind,
      CASE
        WHEN p.bio IS NOT NULL AND length(trim(p.bio)) > 0
          THEN left(trim(p.bio), 160)
        ELSE 'Writer profile'
      END AS excerpt
    FROM public.profiles p, qn
    WHERE qn.term IS NOT NULL
      AND p.username IS NOT NULL
      AND lower(p.username) <> 'anonymous'
      AND COALESCE(p.is_suspended, false) = false
      AND (
        p.username ILIKE '%' || qn.term || '%'
        OR COALESCE(p.full_name, '') ILIKE '%' || qn.term || '%'
      )
    ORDER BY p.username ASC
    LIMIT (SELECT row_limit FROM qn)
  ),
  post_hits AS (
    SELECT
      p.id,
      p.title,
      p.slug,
      'journal'::text AS kind,
      p.excerpt
    FROM public.posts p
    LEFT JOIN public.profiles a ON a.id = p.author_id
    , qn
    WHERE qn.term IS NOT NULL
      AND p.status = 'published'
      AND (
        p.title ILIKE '%' || qn.term || '%'
        OR COALESCE(p.excerpt, '') ILIKE '%' || qn.term || '%'
        OR (
          COALESCE(p.is_anonymous, false) = false
          AND (
            COALESCE(a.username, '') ILIKE '%' || qn.term || '%'
            OR COALESCE(a.full_name, '') ILIKE '%' || qn.term || '%'
          )
        )
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
    FROM public.tech_submissions t
    LEFT JOIN public.profiles a ON a.id = t.author_id
    , qn
    WHERE qn.term IS NOT NULL
      AND t.is_deleted = false
      AND t.status IN ('submitted', 'approved', 'selected', 'archived')
      AND (
        t.title ILIKE '%' || qn.term || '%'
        OR COALESCE(t.summary, '') ILIKE '%' || qn.term || '%'
        OR COALESCE(a.username, '') ILIKE '%' || qn.term || '%'
        OR COALESCE(a.full_name, '') ILIKE '%' || qn.term || '%'
      )
    ORDER BY t.created_at DESC
    LIMIT (SELECT row_limit FROM qn)
  )
  SELECT * FROM author_hits
  UNION ALL
  SELECT * FROM post_hits
  UNION ALL
  SELECT * FROM tech_hits
  LIMIT (SELECT row_limit FROM qn);
$$;

GRANT EXECUTE ON FUNCTION public.search_content(text, int) TO anon, authenticated;
