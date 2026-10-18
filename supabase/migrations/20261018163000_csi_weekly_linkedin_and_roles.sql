-- Migration: Add CSI Weekly LinkedIn Pick workflow, peer interaction on in_review posts,
-- Super Admin god-mode policies, and Technical Head accounts for Darshan and Tanish.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Add Weekly LinkedIn Pick columns to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS linkedin_pick_week text,
  ADD COLUMN IF NOT EXISTS linkedin_picked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Guarantee at the database level that at most ONE post per publication per week
-- can be chosen as the official Weekly LinkedIn Pick.
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_unique_weekly_linkedin_pick
  ON public.posts (publication_id, linkedin_pick_week)
  WHERE linkedin_pick_week IS NOT NULL;

-- 2. Update publication rules trigger to enforce 1-per-week LinkedIn pick for Technical Heads
-- while giving Super Admin (is_admin = true) full override access.
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
  existing_pick_id uuid;
BEGIN
  -- Allow service_role or SQL migrations where auth.uid() is null
  IF caller_id IS NULL THEN
    RETURN NEW;
  END IF;

  caller_is_admin := public.is_admin_user(caller_id);
  IF caller_is_admin THEN
    RETURN NEW;
  END IF;

  -- Non-publication posts cannot use 'in_review' status or linkedin_pick_week
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
    RETURN NEW;
  END IF;

  -- Publication posts: check membership and editor role
  caller_is_member := public.is_publication_member(NEW.publication_id, caller_id);
  caller_is_editor := public.is_publication_editor(NEW.publication_id, caller_id);

  IF NOT caller_is_member AND NOT caller_is_editor THEN
    RAISE EXCEPTION 'Only members of this publication can create or update posts in it.';
  END IF;

  -- Enforce Weekly LinkedIn Pick rules
  IF TG_OP = 'INSERT' AND NEW.linkedin_pick_week IS NOT NULL AND NOT caller_is_editor THEN
    RAISE EXCEPTION 'Only CSI Technical Heads or Super Admins can select the Weekly LinkedIn Pick.';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.linkedin_pick_week IS DISTINCT FROM OLD.linkedin_pick_week THEN
    IF NOT caller_is_editor THEN
      RAISE EXCEPTION 'Only CSI Technical Heads or Super Admins can select the Weekly LinkedIn Pick.';
    END IF;

    IF OLD.linkedin_pick_week IS NOT NULL AND NEW.linkedin_pick_week IS NULL THEN
      RAISE EXCEPTION 'A locked Weekly LinkedIn Pick can only be cleared or reassigned by the Super Admin.';
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
        RAISE EXCEPTION 'Only publication editors can review or update other members posts.';
      END IF;
      IF OLD.status <> 'in_review' AND OLD.status <> 'published' THEN
        RAISE EXCEPTION 'Editors can only review or feature posts that have been submitted for review.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Update RLS policies for peer interaction (Sunday-to-Wednesday submissions),
-- self-service writer onboarding, editor weekly pick selection, and Super Admin god-mode.

-- Allow authenticated users to join a publication as a 'writer'
DROP POLICY IF EXISTS "Users can join publications as writer" ON public.publication_members;
CREATE POLICY "Users can join publications as writer"
  ON public.publication_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'writer'
  );

-- Allow Editors of a publication to manage writer memberships in their publication
DROP POLICY IF EXISTS "Editors can insert publication writers" ON public.publication_members;
CREATE POLICY "Editors can insert publication writers"
  ON public.publication_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_publication_editor(publication_id, auth.uid())
    AND role = 'writer'
  );

-- Allow everyone to view submitted (in_review) and published CSI posts so technical members
-- can read, like, and comment on each other's weekly posts from Sunday to Wednesday.
DROP POLICY IF EXISTS "Editors can view in_review posts for their publication" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view submitted or published publication posts" ON public.posts;
CREATE POLICY "Anyone can view submitted or published publication posts"
  ON public.posts
  FOR SELECT
  TO anon, authenticated
  USING (
    publication_id IS NOT NULL
    AND status IN ('in_review', 'published')
  );

-- Allow Editors to update in_review or published posts in their publication (to approve or set weekly pick)
DROP POLICY IF EXISTS "Editors can review and update in_review posts for their publication" ON public.posts;
CREATE POLICY "Editors can review and update in_review posts for their publication"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (
    publication_id IS NOT NULL
    AND status IN ('in_review', 'published')
    AND public.is_publication_editor(publication_id, auth.uid())
  )
  WITH CHECK (
    publication_id IS NOT NULL
    AND public.is_publication_editor(publication_id, auth.uid())
    AND status IN ('draft', 'in_review', 'published')
  );

-- Super Admin (is_admin = true) full access across posts and comments
DROP POLICY IF EXISTS "Super admins have full access to all posts" ON public.posts;
CREATE POLICY "Super admins have full access to all posts"
  ON public.posts
  FOR ALL
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Super admins can delete any comment" ON public.comments;
CREATE POLICY "Super admins can delete any comment"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Update restrictive policy on posts so in_review publication posts are readable for peer interaction
-- while drafts remain strictly private and writers still cannot self-publish.
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
    OR public.is_admin_user(auth.uid())
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

-- 4. Promote Aryan Dani (Owner & Technical Secretary) to Super Admin and CSI Editor
UPDATE public.profiles
SET is_admin = true
WHERE id IN (
  '24cf47ad-16d8-4ab9-be89-30e9bf5aa716',
  'c66dee8c-eb8e-433e-9eec-9c62b6c8297e'
)
OR username IN ('Kuro', 'killfall0');

INSERT INTO public.publication_members (publication_id, user_id, role)
SELECT pub.id, prof.id, 'editor'
FROM public.publications pub
JOIN public.profiles prof
  ON prof.id IN (
    '24cf47ad-16d8-4ab9-be89-30e9bf5aa716',
    'c66dee8c-eb8e-433e-9eec-9c62b6c8297e'
  )
WHERE pub.slug = 'csi'
ON CONFLICT (publication_id, user_id) DO UPDATE SET role = 'editor';

-- 5. Provision Technical Head login credentials for Darshan and Tanish
DO $$
DECLARE
  v_csi_id uuid;
  v_darshan_id uuid := 'c5100000-0000-4000-8000-000000000001';
  v_tanish_id uuid := 'c5100000-0000-4000-8000-000000000002';
  v_darshan_email text := 'darshan.csi@thefourthclover.tech';
  v_tanish_email text := 'tanish.csi@thefourthclover.tech';
BEGIN
  SELECT id INTO v_csi_id FROM public.publications WHERE slug = 'csi' LIMIT 1;

  -- Create or update Darshan in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_darshan_email OR id = v_darshan_id) THEN
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
      v_darshan_id,
      'authenticated',
      'authenticated',
      v_darshan_email,
      extensions.crypt('CsiLead@Darshan2026!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"darshan_csi","full_name":"Darshan (CSI Technical Head)"}'::jsonb,
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
      v_darshan_id,
      jsonb_build_object('sub', v_darshan_id::text, 'email', v_darshan_email, 'email_verified', true),
      'email',
      v_darshan_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    SELECT id INTO v_darshan_id FROM auth.users WHERE email = v_darshan_email OR id = v_darshan_id LIMIT 1;
    UPDATE auth.users
    SET encrypted_password = extensions.crypt('CsiLead@Darshan2026!', extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_darshan_id;
  END IF;

  INSERT INTO public.profiles (id, username, full_name, bio, is_admin, created_at, updated_at)
  VALUES (
    v_darshan_id,
    'darshan_csi',
    'Darshan',
    'Technical Head at CSI MIT-WPU. Reviewing and curating weekly technical articles.',
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      full_name = EXCLUDED.full_name,
      bio = COALESCE(public.profiles.bio, EXCLUDED.bio),
      updated_at = now();

  -- Create or update Tanish in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_tanish_email OR id = v_tanish_id) THEN
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
      v_tanish_id,
      'authenticated',
      'authenticated',
      v_tanish_email,
      extensions.crypt('CsiLead@Tanish2026!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"tanish_csi","full_name":"Tanish (CSI Technical Head)"}'::jsonb,
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
      v_tanish_id,
      jsonb_build_object('sub', v_tanish_id::text, 'email', v_tanish_email, 'email_verified', true),
      'email',
      v_tanish_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    SELECT id INTO v_tanish_id FROM auth.users WHERE email = v_tanish_email OR id = v_tanish_id LIMIT 1;
    UPDATE auth.users
    SET encrypted_password = extensions.crypt('CsiLead@Tanish2026!', extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_tanish_id;
  END IF;

  INSERT INTO public.profiles (id, username, full_name, bio, is_admin, created_at, updated_at)
  VALUES (
    v_tanish_id,
    'tanish_csi',
    'Tanish',
    'Technical Head at CSI MIT-WPU. Reviewing and curating weekly technical articles.',
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      full_name = EXCLUDED.full_name,
      bio = COALESCE(public.profiles.bio, EXCLUDED.bio),
      updated_at = now();

  -- Register Darshan and Tanish as CSI Editors
  IF v_csi_id IS NOT NULL THEN
    INSERT INTO public.publication_members (publication_id, user_id, role)
    VALUES
      (v_csi_id, v_darshan_id, 'editor'),
      (v_csi_id, v_tanish_id, 'editor')
    ON CONFLICT (publication_id, user_id) DO UPDATE SET role = 'editor';
  END IF;
END $$;
