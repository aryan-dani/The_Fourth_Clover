-- Migration: CSI Tech Weekly, Roster + PRN 2FA Verification, Role Hierarchy,
-- IST Weekly Cutoff Enforcement, Audit Logging, and Full RLS + Storage Hardening.
-- Note: Zero roster PII is stored in this migration. Roster rows are seeded via
-- `npm run seed:roster -- ./roster.csv` using HMAC-SHA256 hashed PRNs.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================================
-- 1. CLEAN UP LEGACY SYNTHETIC ACCOUNTS & SELF-SERVICE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can join publications as writer" ON public.publication_members;
DROP POLICY IF EXISTS "Editors can insert publication writers" ON public.publication_members;

DO $$
DECLARE
  v_synthetic_ids uuid[] := ARRAY[
    'c5100000-0000-4000-8000-000000000001'::uuid,
    'c5100000-0000-4000-8000-000000000002'::uuid
  ];
BEGIN
  DELETE FROM public.publication_members WHERE user_id = ANY(v_synthetic_ids);
  DELETE FROM public.profiles WHERE id = ANY(v_synthetic_ids);
  DELETE FROM auth.identities WHERE user_id = ANY(v_synthetic_ids);
  DELETE FROM auth.users WHERE id = ANY(v_synthetic_ids);
END $$;

-- ============================================================================
-- 2. EXTEND PROFILES WITH CSI IDENTITY & ROLE HIERARCHY
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS csi_id integer UNIQUE,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS dept text,
  ADD COLUMN IF NOT EXISTS year text,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

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
      AND t.relname = 'profiles'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', con_name);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('unverified', 'member', 'tech_member', 'tech_head', 'super_admin'));

-- Ensure existing owner account (CSI ID 303) has super_admin role
UPDATE public.profiles
SET role = 'super_admin',
    is_admin = true,
    csi_id = COALESCE(csi_id, 303),
    dept = COALESCE(dept, 'Tech')
WHERE id = '24cf47ad-16d8-4ab9-be89-30e9bf5aa716'
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE csi_id = 303 AND id <> '24cf47ad-16d8-4ab9-be89-30e9bf5aa716');

-- ============================================================================
-- 3. ROLE & SECURITY HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT role
      FROM public.profiles
      WHERE id = uid
        AND is_suspended = false
    ),
    'unverified'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = uid
      AND is_suspended = false
      AND (role = 'super_admin' OR csi_id = 303 OR is_admin = true)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin(uid);
$$;

CREATE OR REPLACE FUNCTION public.is_tech_head_or_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = uid
      AND is_suspended = false
      AND (
        role IN ('tech_head', 'super_admin')
        OR csi_id IN (241, 246, 303)
        OR is_admin = true
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_tech_member(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = uid
      AND is_suspended = false
      AND (
        (role IN ('tech_member', 'tech_head', 'super_admin') AND csi_id IS NOT NULL)
        OR is_admin = true
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_roster_member(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = uid
      AND is_suspended = false
      AND (
        (role IN ('member', 'tech_member', 'tech_head', 'super_admin') AND csi_id IS NOT NULL)
        OR is_admin = true
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_tech_head_or_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_tech_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_roster_member(uuid) TO anon, authenticated;

-- Prevent clients from escalating their own role, is_admin, csi_id, dept, year, or is_suspended
CREATE OR REPLACE FUNCTION public.enforce_profile_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  internal_sync text := current_setting('app.internal_role_sync', true);
BEGIN
  -- Allow service_role (auth.uid() IS NULL), internal SECURITY DEFINER RPCs, or super_admin
  IF caller_id IS NULL OR internal_sync = 'on' OR public.is_super_admin(caller_id) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.id <> caller_id THEN
      RAISE EXCEPTION 'Cannot create a profile for another user.';
    END IF;
    NEW.is_admin := false;
    NEW.role := 'unverified';
    NEW.csi_id := NULL;
    NEW.dept := NULL;
    NEW.year := NULL;
    NEW.is_suspended := false;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.id <> caller_id THEN
      RAISE EXCEPTION 'Cannot update another user profile.';
    END IF;
    IF OLD.is_suspended = true THEN
      RAISE EXCEPTION 'Your account is currently suspended.';
    END IF;
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.csi_id IS DISTINCT FROM OLD.csi_id
       OR NEW.dept IS DISTINCT FROM OLD.dept
       OR NEW.year IS DISTINCT FROM OLD.year
       OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended THEN
      RAISE EXCEPTION 'Unauthorized: role, CSI ID, and administrative fields are server-controlled.';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_security ON public.profiles;
CREATE TRIGGER trg_enforce_profile_security
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_security();

-- ============================================================================
-- 4. CSI ROSTER, VERIFICATION ATTEMPTS, AND AUDIT LOG TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.csi_roster (
  csi_id integer PRIMARY KEY,
  name text NOT NULL,
  dept text NOT NULL,
  year text,
  prn_hash text,
  prn_missing boolean NOT NULL DEFAULT false,
  prn_duplicate boolean NOT NULL DEFAULT false,
  role text NOT NULL CHECK (role IN ('member', 'tech_member', 'tech_head', 'super_admin')),
  claimed_by uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.csi_verification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash text,
  attempted_csi_id integer,
  success boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csi_verification_attempts_user_time
  ON public.csi_verification_attempts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_csi_verification_attempts_ip_time
  ON public.csi_verification_attempts(ip_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_csi_id integer,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON public.audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_action_created
  ON public.audit_log(action, created_at DESC);

ALTER TABLE public.csi_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csi_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Strict column & table privileges: never expose prn_hash to anon or authenticated clients
REVOKE ALL ON public.csi_roster FROM anon, authenticated;
GRANT SELECT (csi_id, name, dept, year, prn_missing, prn_duplicate, role, claimed_by, claimed_at, created_at, updated_at)
  ON public.csi_roster TO authenticated;

REVOKE ALL ON public.csi_verification_attempts FROM anon, authenticated;
GRANT SELECT ON public.csi_verification_attempts TO authenticated;

REVOKE ALL ON public.audit_log FROM anon, authenticated;
GRANT SELECT ON public.audit_log TO authenticated;

-- RLS policies for csi_roster: only super_admin can inspect the full roster;
-- verified users can read only their own claimed row (without prn_hash).
DROP POLICY IF EXISTS "Super admin can view all roster rows" ON public.csi_roster;
CREATE POLICY "Super admin can view all roster rows"
  ON public.csi_roster
  FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR claimed_by = auth.uid()
  );

-- RLS policies for csi_verification_attempts: only super_admin can view
DROP POLICY IF EXISTS "Super admin can view verification attempts" ON public.csi_verification_attempts;
CREATE POLICY "Super admin can view verification attempts"
  ON public.csi_verification_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- RLS policies for audit_log: only super_admin can view
DROP POLICY IF EXISTS "Super admin can view audit log" ON public.audit_log;
CREATE POLICY "Super admin can view audit log"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- ============================================================================
-- 5. TRANSACTIONAL CSI CLAIM & SUPER ADMIN MANAGEMENT RPCs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.claim_csi_identity(
  p_csi_id integer,
  p_prn_hash text,
  p_ip_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_roster public.csi_roster%ROWTYPE;
  v_failed_user_attempts integer := 0;
  v_failed_ip_attempts integer := 0;
  v_assigned_role text;
  v_csi_pub_id uuid;
  v_generic_error text := 'Verification failed. Please check your CSI ID and PRN, or contact the Technical Secretary.';
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must be signed in to verify your CSI ID.');
  END IF;

  -- 1. Rate-limit check (max 5 failed attempts in the past 1 hour per user or IP)
  SELECT count(*) INTO v_failed_user_attempts
  FROM public.csi_verification_attempts
  WHERE user_id = v_uid
    AND success = false
    AND created_at > now() - interval '1 hour';

  IF p_ip_hash IS NOT NULL AND length(trim(p_ip_hash)) > 0 THEN
    SELECT count(*) INTO v_failed_ip_attempts
    FROM public.csi_verification_attempts
    WHERE ip_hash = p_ip_hash
      AND success = false
      AND created_at > now() - interval '1 hour';
  END IF;

  IF v_failed_user_attempts >= 5 OR v_failed_ip_attempts >= 5 THEN
    INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
    VALUES (
      v_uid,
      'csi_verify.rate_limited',
      'csi_roster',
      p_csi_id::text,
      jsonb_build_object('ip_hash', p_ip_hash, 'user_attempts', v_failed_user_attempts, 'ip_attempts', v_failed_ip_attempts)
    );
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Too many verification attempts. Please wait one hour before trying again.'
    );
  END IF;

  -- 2. Lock caller profile row (FOR UPDATE) to prevent concurrent claims by the same user
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_uid
  FOR UPDATE;

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', v_generic_error);
  END IF;

  IF v_profile.is_suspended THEN
    RETURN jsonb_build_object('success', false, 'error', 'Your account is suspended.');
  END IF;

  IF v_profile.csi_id IS NOT NULL THEN
    INSERT INTO public.csi_verification_attempts (user_id, ip_hash, attempted_csi_id, success, reason)
    VALUES (v_uid, p_ip_hash, p_csi_id, false, 'already_verified');
    RETURN jsonb_build_object('success', false, 'error', v_generic_error);
  END IF;

  -- 3. Lock target roster row (SELECT ... FOR UPDATE) so two simultaneous claims cannot both succeed
  SELECT * INTO v_roster
  FROM public.csi_roster
  WHERE csi_id = p_csi_id
  FOR UPDATE;

  IF v_roster.csi_id IS NULL THEN
    INSERT INTO public.csi_verification_attempts (user_id, ip_hash, attempted_csi_id, success, reason)
    VALUES (v_uid, p_ip_hash, p_csi_id, false, 'id_not_found');
    INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
    VALUES (v_uid, 'csi_verify.failed', 'csi_roster', p_csi_id::text, jsonb_build_object('reason', 'id_not_found', 'ip_hash', p_ip_hash));
    RETURN jsonb_build_object('success', false, 'error', v_generic_error);
  END IF;

  IF v_roster.claimed_by IS NOT NULL THEN
    INSERT INTO public.csi_verification_attempts (user_id, ip_hash, attempted_csi_id, success, reason)
    VALUES (v_uid, p_ip_hash, p_csi_id, false, 'already_claimed');
    INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
    VALUES (v_uid, 'csi_verify.failed', 'csi_roster', p_csi_id::text, jsonb_build_object('reason', 'already_claimed', 'ip_hash', p_ip_hash));
    RETURN jsonb_build_object('success', false, 'error', v_generic_error);
  END IF;

  IF v_roster.prn_missing OR v_roster.prn_duplicate OR v_roster.prn_hash IS NULL THEN
    INSERT INTO public.csi_verification_attempts (user_id, ip_hash, attempted_csi_id, success, reason)
    VALUES (v_uid, p_ip_hash, p_csi_id, false, 'manual_link_required');
    INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
    VALUES (v_uid, 'csi_verify.failed', 'csi_roster', p_csi_id::text, jsonb_build_object('reason', 'manual_link_required', 'ip_hash', p_ip_hash));
    RETURN jsonb_build_object('success', false, 'error', v_generic_error);
  END IF;

  IF p_prn_hash IS NULL OR v_roster.prn_hash <> p_prn_hash THEN
    INSERT INTO public.csi_verification_attempts (user_id, ip_hash, attempted_csi_id, success, reason)
    VALUES (v_uid, p_ip_hash, p_csi_id, false, 'prn_mismatch');
    INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
    VALUES (v_uid, 'csi_verify.failed', 'csi_roster', p_csi_id::text, jsonb_build_object('reason', 'prn_mismatch', 'ip_hash', p_ip_hash));
    RETURN jsonb_build_object('success', false, 'error', v_generic_error);
  END IF;

  -- 4. Assign role strictly by CSI ID and Dept (never by name)
  IF p_csi_id = 303 THEN
    v_assigned_role := 'super_admin';
  ELSIF p_csi_id IN (241, 246) THEN
    v_assigned_role := 'tech_head';
  ELSIF lower(trim(v_roster.dept)) = 'tech' THEN
    v_assigned_role := 'tech_member';
  ELSE
    v_assigned_role := 'member';
  END IF;

  -- 5. Mark roster row as claimed and update user profile atomically
  UPDATE public.csi_roster
  SET claimed_by = v_uid,
      claimed_at = now(),
      role = v_assigned_role,
      updated_at = now()
  WHERE csi_id = p_csi_id;

  PERFORM set_config('app.internal_role_sync', 'on', true);

  UPDATE public.profiles
  SET csi_id = p_csi_id,
      role = v_assigned_role,
      dept = v_roster.dept,
      year = v_roster.year,
      full_name = COALESCE(NULLIF(trim(full_name), ''), v_roster.name),
      is_admin = (v_assigned_role = 'super_admin'),
      updated_at = now()
  WHERE id = v_uid;

  -- Keep legacy publication_members in sync for verified tech members
  SELECT id INTO v_csi_pub_id FROM public.publications WHERE slug = 'csi' LIMIT 1;
  IF v_csi_pub_id IS NOT NULL AND v_assigned_role IN ('tech_member', 'tech_head', 'super_admin') THEN
    INSERT INTO public.publication_members (publication_id, user_id, role)
    VALUES (
      v_csi_pub_id,
      v_uid,
      CASE WHEN v_assigned_role IN ('tech_head', 'super_admin') THEN 'editor' ELSE 'writer' END
    )
    ON CONFLICT (publication_id, user_id)
    DO UPDATE SET role = EXCLUDED.role;
  END IF;

  INSERT INTO public.csi_verification_attempts (user_id, ip_hash, attempted_csi_id, success, reason)
  VALUES (v_uid, p_ip_hash, p_csi_id, true, 'verified');

  INSERT INTO public.audit_log (
    actor_id,
    actor_csi_id,
    action,
    target_type,
    target_id,
    before_state,
    after_state,
    metadata
  ) VALUES (
    v_uid,
    p_csi_id,
    'csi_verify.claimed',
    'csi_roster',
    p_csi_id::text,
    jsonb_build_object('claimed_by', null, 'profile_role', v_profile.role),
    jsonb_build_object('claimed_by', v_uid, 'profile_role', v_assigned_role, 'dept', v_roster.dept, 'year', v_roster.year),
    jsonb_build_object('ip_hash', p_ip_hash)
  );

  RETURN jsonb_build_object(
    'success', true,
    'csi_id', p_csi_id,
    'role', v_assigned_role,
    'dept', v_roster.dept,
    'year', v_roster.year
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_csi_identity(integer, text, text) TO authenticated;

-- Super Admin RPC to link, unlink, or reassign a CSI ID to a user profile
CREATE OR REPLACE FUNCTION public.admin_assign_csi_identity(
  p_target_user_id uuid,
  p_csi_id integer,
  p_override_role text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_target_profile public.profiles%ROWTYPE;
  v_roster public.csi_roster%ROWTYPE;
  v_prev_user_id uuid;
  v_role text;
  v_csi_pub_id uuid;
BEGIN
  IF v_caller_id IS NOT NULL AND NOT public.is_super_admin(v_caller_id) THEN
    RAISE EXCEPTION 'Unauthorized: only super_admin can link or reassign CSI IDs.';
  END IF;

  PERFORM set_config('app.internal_role_sync', 'on', true);

  SELECT * INTO v_target_profile FROM public.profiles WHERE id = p_target_user_id FOR UPDATE;
  IF v_target_profile.id IS NULL THEN
    RAISE EXCEPTION 'Target user profile not found.';
  END IF;

  -- If unlinking (p_csi_id IS NULL)
  IF p_csi_id IS NULL THEN
    IF v_target_profile.csi_id IS NOT NULL THEN
      UPDATE public.csi_roster
      SET claimed_by = NULL,
          claimed_at = NULL,
          updated_at = now()
      WHERE csi_id = v_target_profile.csi_id;
    END IF;

    UPDATE public.profiles
    SET csi_id = NULL,
        role = COALESCE(p_override_role, 'unverified'),
        dept = NULL,
        year = NULL,
        is_admin = (COALESCE(p_override_role, 'unverified') = 'super_admin'),
        updated_at = now()
    WHERE id = p_target_user_id;

    DELETE FROM public.publication_members WHERE user_id = p_target_user_id;

    INSERT INTO public.audit_log (actor_id, actor_csi_id, action, target_type, target_id, before_state, after_state)
    VALUES (
      v_caller_id,
      303,
      'admin.unlink_csi_id',
      'profiles',
      p_target_user_id::text,
      jsonb_build_object('csi_id', v_target_profile.csi_id, 'role', v_target_profile.role),
      jsonb_build_object('csi_id', null, 'role', COALESCE(p_override_role, 'unverified'))
    );

    RETURN jsonb_build_object('success', true, 'action', 'unlinked');
  END IF;

  -- Linking or reassigning a CSI ID
  SELECT * INTO v_roster FROM public.csi_roster WHERE csi_id = p_csi_id FOR UPDATE;
  IF v_roster.csi_id IS NULL THEN
    RAISE EXCEPTION 'CSI ID % does not exist in the roster.', p_csi_id;
  END IF;

  v_prev_user_id := v_roster.claimed_by;

  -- Clear any previous owner of this CSI ID
  IF v_prev_user_id IS NOT NULL AND v_prev_user_id <> p_target_user_id THEN
    UPDATE public.profiles
    SET csi_id = NULL,
        role = 'unverified',
        dept = NULL,
        year = NULL,
        is_admin = false,
        updated_at = now()
    WHERE id = v_prev_user_id;
    DELETE FROM public.publication_members WHERE user_id = v_prev_user_id;
  END IF;

  -- Clear target user's previous CSI ID if they had a different one
  IF v_target_profile.csi_id IS NOT NULL AND v_target_profile.csi_id <> p_csi_id THEN
    UPDATE public.csi_roster
    SET claimed_by = NULL,
        claimed_at = NULL,
        updated_at = now()
    WHERE csi_id = v_target_profile.csi_id;
  END IF;

  IF p_override_role IS NOT NULL THEN
    v_role := p_override_role;
  ELSIF p_csi_id = 303 THEN
    v_role := 'super_admin';
  ELSIF p_csi_id IN (241, 246) THEN
    v_role := 'tech_head';
  ELSIF lower(trim(v_roster.dept)) = 'tech' THEN
    v_role := 'tech_member';
  ELSE
    v_role := 'member';
  END IF;

  UPDATE public.csi_roster
  SET claimed_by = p_target_user_id,
      claimed_at = now(),
      role = v_role,
      updated_at = now()
  WHERE csi_id = p_csi_id;

  UPDATE public.profiles
  SET csi_id = p_csi_id,
      role = v_role,
      dept = v_roster.dept,
      year = v_roster.year,
      full_name = COALESCE(NULLIF(trim(full_name), ''), v_roster.name),
      is_admin = (v_role = 'super_admin'),
      updated_at = now()
  WHERE id = p_target_user_id;

  SELECT id INTO v_csi_pub_id FROM public.publications WHERE slug = 'csi' LIMIT 1;
  IF v_csi_pub_id IS NOT NULL THEN
    IF v_role IN ('tech_member', 'tech_head', 'super_admin') THEN
      INSERT INTO public.publication_members (publication_id, user_id, role)
      VALUES (
        v_csi_pub_id,
        p_target_user_id,
        CASE WHEN v_role IN ('tech_head', 'super_admin') THEN 'editor' ELSE 'writer' END
      )
      ON CONFLICT (publication_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    ELSE
      DELETE FROM public.publication_members
      WHERE publication_id = v_csi_pub_id AND user_id = p_target_user_id;
    END IF;
  END IF;

  INSERT INTO public.audit_log (actor_id, actor_csi_id, action, target_type, target_id, before_state, after_state)
  VALUES (
    v_caller_id,
    303,
    'admin.assign_csi_id',
    'profiles',
    p_target_user_id::text,
    jsonb_build_object('prev_csi_id', v_target_profile.csi_id, 'prev_role', v_target_profile.role, 'displaced_user_id', v_prev_user_id),
    jsonb_build_object('csi_id', p_csi_id, 'role', v_role, 'dept', v_roster.dept, 'year', v_roster.year)
  );

  RETURN jsonb_build_object('success', true, 'csi_id', p_csi_id, 'role', v_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assign_csi_identity(uuid, integer, text) TO authenticated;

-- ============================================================================
-- 6. PLATFORM SETTINGS & TECH WEEKLY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cutoff_day integer NOT NULL DEFAULT 3 CHECK (cutoff_day BETWEEN 0 AND 6),
  cutoff_hour_ist integer NOT NULL DEFAULT 9 CHECK (cutoff_hour_ist BETWEEN 0 AND 23),
  cutoff_minute_ist integer NOT NULL DEFAULT 0 CHECK (cutoff_minute_ist BETWEEN 0 AND 59),
  posts_per_week integer NOT NULL DEFAULT 1 CHECK (posts_per_week BETWEEN 1 AND 10),
  allow_member_comments boolean NOT NULL DEFAULT false,
  submissions_override text NOT NULL DEFAULT 'auto' CHECK (submissions_override IN ('auto', 'force_open', 'force_closed')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.platform_settings (id, cutoff_day, cutoff_hour_ist, cutoff_minute_ist, posts_per_week, allow_member_comments, submissions_override)
VALUES (1, 3, 9, 0, 1, false, 'auto')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT UPDATE ON public.platform_settings TO authenticated;

DROP POLICY IF EXISTS "Platform settings are readable by everyone" ON public.platform_settings;
CREATE POLICY "Platform settings are readable by everyone"
  ON public.platform_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admin can update platform settings" ON public.platform_settings;
CREATE POLICY "Super admin can update platform settings"
  ON public.platform_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.tech_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_key text NOT NULL UNIQUE,
  week_number integer,
  title text NOT NULL,
  prompt text,
  starts_at timestamptz NOT NULL,
  cutoff_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tech_weeks_starts_at
  ON public.tech_weeks(starts_at DESC);

ALTER TABLE public.tech_weeks ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tech_weeks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tech_weeks TO authenticated;

DROP POLICY IF EXISTS "Tech weeks are viewable by everyone" ON public.tech_weeks;
CREATE POLICY "Tech weeks are viewable by everyone"
  ON public.tech_weeks
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admin can manage tech weeks" ON public.tech_weeks;
CREATE POLICY "Super admin can manage tech weeks"
  ON public.tech_weeks
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Helper function to ensure the current IST week row exists in tech_weeks
CREATE OR REPLACE FUNCTION public.get_or_create_current_tech_week()
RETURNS public.tech_weeks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now_ist timestamp without time zone := (now() AT TIME ZONE 'Asia/Kolkata');
  v_dow integer := EXTRACT(DOW FROM v_now_ist)::integer;
  v_sunday_ist timestamp without time zone;
  v_week_key text;
  v_starts_at timestamptz;
  v_cutoff_at timestamptz;
  v_ends_at timestamptz;
  v_settings public.platform_settings%ROWTYPE;
  v_week public.tech_weeks%ROWTYPE;
  v_count integer;
BEGIN
  v_sunday_ist := date_trunc('day', v_now_ist) - make_interval(days => v_dow);
  v_week_key := to_char(v_sunday_ist, 'YYYY-MM-DD');

  SELECT * INTO v_week FROM public.tech_weeks WHERE week_key = v_week_key LIMIT 1;
  IF v_week.id IS NOT NULL THEN
    RETURN v_week;
  END IF;

  SELECT * INTO v_settings FROM public.platform_settings WHERE id = 1;
  v_starts_at := (v_sunday_ist AT TIME ZONE 'Asia/Kolkata');
  v_cutoff_at := ((v_sunday_ist + make_interval(
    days => COALESCE(v_settings.cutoff_day, 3),
    hours => COALESCE(v_settings.cutoff_hour_ist, 9),
    mins => COALESCE(v_settings.cutoff_minute_ist, 0)
  )) AT TIME ZONE 'Asia/Kolkata');
  v_ends_at := ((v_sunday_ist + interval '7 days' - interval '1 second') AT TIME ZONE 'Asia/Kolkata');

  SELECT count(*) + 1 INTO v_count FROM public.tech_weeks;

  INSERT INTO public.tech_weeks (
    week_key,
    week_number,
    title,
    prompt,
    starts_at,
    cutoff_at,
    ends_at
  ) VALUES (
    v_week_key,
    v_count,
    'CSI Tech Weekly: Week of ' || to_char(v_sunday_ist, 'FMMon DD, YYYY'),
    'Share a technical deep-dive, system design breakdown, or engineering tutorial with the CSI MIT-WPU community.',
    v_starts_at,
    v_cutoff_at,
    v_ends_at
  )
  ON CONFLICT (week_key) DO UPDATE SET updated_at = EXCLUDED.starts_at
  RETURNING * INTO v_week;

  RETURN v_week;
EXCEPTION WHEN OTHERS THEN
  SELECT * INTO v_week FROM public.tech_weeks ORDER BY starts_at DESC LIMIT 1;
  RETURN v_week;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_current_tech_week() TO anon, authenticated;

-- Seed the current IST week immediately
DO $$
DECLARE
  v_now_ist timestamp without time zone := (now() AT TIME ZONE 'Asia/Kolkata');
  v_dow integer := EXTRACT(DOW FROM v_now_ist)::integer;
  v_sunday_ist timestamp without time zone := date_trunc('day', v_now_ist) - make_interval(days => v_dow);
  v_week_key text := to_char(v_sunday_ist, 'YYYY-MM-DD');
BEGIN
  INSERT INTO public.tech_weeks (
    week_key,
    week_number,
    title,
    prompt,
    starts_at,
    cutoff_at,
    ends_at
  ) VALUES (
    v_week_key,
    1,
    'CSI Tech Weekly: Week of ' || to_char(v_sunday_ist, 'FMMon DD, YYYY'),
    'Share a technical deep-dive, system design breakdown, or engineering tutorial with the CSI MIT-WPU community.',
    (v_sunday_ist AT TIME ZONE 'Asia/Kolkata'),
    ((v_sunday_ist + interval '3 days 9 hours') AT TIME ZONE 'Asia/Kolkata'),
    ((v_sunday_ist + interval '7 days' - interval '1 second') AT TIME ZONE 'Asia/Kolkata')
  )
  ON CONFLICT (week_key) DO NOTHING;
END $$;

-- Check whether the submission window is currently open in Asia/Kolkata time
CREATE OR REPLACE FUNCTION public.is_submission_window_open(p_week_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.platform_settings%ROWTYPE;
  v_week public.tech_weeks%ROWTYPE;
  v_now_ist timestamp without time zone := (now() AT TIME ZONE 'Asia/Kolkata');
  v_dow integer := EXTRACT(DOW FROM v_now_ist)::integer;
  v_mins_today integer := EXTRACT(HOUR FROM v_now_ist)::integer * 60 + EXTRACT(MINUTE FROM v_now_ist)::integer;
  v_cutoff_mins integer;
BEGIN
  SELECT * INTO v_settings FROM public.platform_settings WHERE id = 1;
  IF v_settings.submissions_override = 'force_open' THEN
    RETURN true;
  END IF;
  IF v_settings.submissions_override = 'force_closed' THEN
    RETURN false;
  END IF;

  SELECT * INTO v_week FROM public.tech_weeks WHERE id = p_week_id;
  IF v_week.id IS NULL OR v_week.is_locked THEN
    RETURN false;
  END IF;

  IF now() < v_week.starts_at OR now() >= v_week.cutoff_at THEN
    RETURN false;
  END IF;

  v_cutoff_mins := COALESCE(v_settings.cutoff_hour_ist, 9) * 60 + COALESCE(v_settings.cutoff_minute_ist, 0);
  IF v_dow > COALESCE(v_settings.cutoff_day, 3) THEN
    RETURN false;
  END IF;
  IF v_dow = COALESCE(v_settings.cutoff_day, 3) AND v_mins_today >= v_cutoff_mins THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_submission_window_open(uuid) TO anon, authenticated;

-- ============================================================================
-- 7. TECH SUBMISSIONS TABLE, PARTIAL UNIQUE INDEX & CUTOFF/ROLE TRIGGER
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tech_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.tech_weeks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 220),
  slug text NOT NULL UNIQUE,
  summary text,
  content text NOT NULL,
  cover_image text,
  tags text[] NOT NULL DEFAULT '{}',
  word_count integer NOT NULL DEFAULT 0,
  read_time integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'selected', 'archived')),
  review_note text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  selected_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  selected_at timestamptz,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);

-- Database invariant: At most ONE selected post per week
CREATE UNIQUE INDEX IF NOT EXISTS idx_tech_submissions_one_selected_per_week
  ON public.tech_submissions(week_id)
  WHERE status = 'selected' AND is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_tech_submissions_week_status
  ON public.tech_submissions(week_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tech_submissions_author_week
  ON public.tech_submissions(author_id, week_id);

CREATE OR REPLACE FUNCTION public.enforce_tech_submission_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_internal_sync text := current_setting('app.internal_role_sync', true);
  v_is_super boolean := false;
  v_is_head boolean := false;
  v_is_tech boolean := false;
  v_word_count integer := 0;
  v_posts_per_week integer := 1;
  v_existing_count integer := 0;
  v_trimmed text;
BEGIN
  -- Compute word count and read time
  v_trimmed := trim(regexp_replace(COALESCE(NEW.content, ''), '\s+', ' ', 'g'));
  IF length(v_trimmed) = 0 THEN
    v_word_count := 0;
  ELSE
    v_word_count := array_length(regexp_split_to_array(v_trimmed, ' '), 1);
  END IF;

  IF v_word_count > 2000 THEN
    RAISE EXCEPTION 'Submission exceeds the hard cap of 2000 words (current: % words).', v_word_count;
  END IF;

  NEW.word_count := v_word_count;
  NEW.read_time := GREATEST(1, CEIL(v_word_count::numeric / 200.0)::integer);
  NEW.updated_at := now();

  IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status = 'draft') AND NEW.submitted_at IS NULL THEN
    NEW.submitted_at := now();
  END IF;

  -- Allow service_role, internal RPCs, or super_admin (CSI ID 303) full override
  IF v_caller_id IS NULL OR v_internal_sync = 'on' OR public.is_super_admin(v_caller_id) THEN
    IF NEW.status = 'selected' AND NEW.selected_at IS NULL THEN
      NEW.selected_at := now();
      NEW.selected_by := COALESCE(NEW.selected_by, v_caller_id);
    END IF;
    RETURN NEW;
  END IF;

  v_is_tech := public.is_verified_tech_member(v_caller_id);
  v_is_head := public.is_tech_head_or_admin(v_caller_id);

  IF NOT v_is_tech THEN
    RAISE EXCEPTION 'Unauthorized: only verified CSI Technical members can create or update Tech Weekly submissions.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.author_id <> v_caller_id THEN
      RAISE EXCEPTION 'You can only create submissions under your own author_id.';
    END IF;

    IF NEW.status NOT IN ('draft', 'submitted') THEN
      RAISE EXCEPTION 'New submissions must start as draft or submitted.';
    END IF;

    IF NOT public.is_submission_window_open(NEW.week_id) THEN
      RAISE EXCEPTION 'Submissions for this week are locked (Wednesday 09:00 IST cutoff).';
    END IF;

    SELECT COALESCE(posts_per_week, 1) INTO v_posts_per_week FROM public.platform_settings WHERE id = 1;
    SELECT count(*) INTO v_existing_count
    FROM public.tech_submissions
    WHERE week_id = NEW.week_id
      AND author_id = v_caller_id
      AND is_deleted = false
      AND status <> 'rejected';

    IF v_existing_count >= v_posts_per_week THEN
      RAISE EXCEPTION 'You have already reached the limit of % submission(s) for this week.', v_posts_per_week;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.author_id <> OLD.author_id OR NEW.week_id <> OLD.week_id THEN
      RAISE EXCEPTION 'Cannot change submission author or week.';
    END IF;

    IF NEW.is_deleted IS DISTINCT FROM OLD.is_deleted THEN
      RAISE EXCEPTION 'Only Super Admin can delete or restore submissions.';
    END IF;

    -- Case A: Author updating their own draft or submitted post before cutoff
    IF OLD.author_id = v_caller_id AND NEW.status IN ('draft', 'submitted') AND OLD.status IN ('draft', 'submitted') THEN
      IF NOT public.is_submission_window_open(NEW.week_id) THEN
        RAISE EXCEPTION 'The Wednesday 09:00 IST cutoff has passed. Submissions are locked for editing.';
      END IF;
      RETURN NEW;
    END IF;

    -- Case B: Technical Head (CSI IDs 241, 246) reviewing or selecting a submission
    IF v_is_head THEN
      IF NEW.title IS DISTINCT FROM OLD.title
         OR NEW.content IS DISTINCT FROM OLD.content
         OR NEW.summary IS DISTINCT FROM OLD.summary THEN
        IF OLD.author_id <> v_caller_id OR NOT public.is_submission_window_open(NEW.week_id) THEN
          RAISE EXCEPTION 'Technical Heads can review and select submissions, but cannot edit another author content or edit after cutoff.';
        END IF;
      END IF;

      IF NEW.status IN ('approved', 'rejected', 'selected', 'submitted') THEN
        NEW.reviewed_by := v_caller_id;
        NEW.reviewed_at := now();
        IF NEW.status = 'selected' THEN
          NEW.selected_by := v_caller_id;
          NEW.selected_at := now();
        END IF;

        INSERT INTO public.audit_log (actor_id, action, target_type, target_id, before_state, after_state)
        VALUES (
          v_caller_id,
          'tech_weekly.review_' || NEW.status,
          'tech_submissions',
          NEW.id::text,
          jsonb_build_object('status', OLD.status, 'review_note', OLD.review_note),
          jsonb_build_object('status', NEW.status, 'review_note', NEW.review_note)
        );
        RETURN NEW;
      END IF;
    END IF;

    RAISE EXCEPTION 'Unauthorized submission update or invalid status transition.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_tech_submission_rules ON public.tech_submissions;
CREATE TRIGGER trg_enforce_tech_submission_rules
  BEFORE INSERT OR UPDATE ON public.tech_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tech_submission_rules();

-- Atomic RPC for Technical Heads (241, 246) and Super Admin (303) to select the ONE weekly LinkedIn pick.
-- If another post was previously selected for that week, it is atomically replaced and both actions are logged in audit_log.
CREATE OR REPLACE FUNCTION public.select_tech_weekly_pick(
  p_submission_id uuid,
  p_review_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_csi_id integer;
  v_target public.tech_submissions%ROWTYPE;
  v_prev public.tech_submissions%ROWTYPE;
BEGIN
  IF v_caller_id IS NULL OR NOT public.is_tech_head_or_admin(v_caller_id) THEN
    RAISE EXCEPTION 'Unauthorized: only Technical Heads (CSI IDs 241, 246) or Super Admin (303) can select the Weekly LinkedIn Pick.';
  END IF;

  SELECT csi_id INTO v_caller_csi_id FROM public.profiles WHERE id = v_caller_id;

  SELECT * INTO v_target
  FROM public.tech_submissions
  WHERE id = p_submission_id
    AND is_deleted = false
  FOR UPDATE;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Submission not found.';
  END IF;

  IF v_target.status = 'draft' THEN
    RAISE EXCEPTION 'Drafts cannot be selected as the Weekly LinkedIn Pick.';
  END IF;

  PERFORM set_config('app.internal_role_sync', 'on', true);

  -- Check if another post is already selected for this week
  SELECT * INTO v_prev
  FROM public.tech_submissions
  WHERE week_id = v_target.week_id
    AND status = 'selected'
    AND is_deleted = false
    AND id <> p_submission_id
  FOR UPDATE;

  IF v_prev.id IS NOT NULL THEN
    UPDATE public.tech_submissions
    SET status = 'approved',
        updated_at = now()
    WHERE id = v_prev.id;

    INSERT INTO public.audit_log (
      actor_id,
      actor_csi_id,
      action,
      target_type,
      target_id,
      before_state,
      after_state
    ) VALUES (
      v_caller_id,
      v_caller_csi_id,
      'tech_weekly.pick_replaced',
      'tech_submissions',
      v_prev.id::text,
      jsonb_build_object('status', 'selected', 'selected_by', v_prev.selected_by, 'title', v_prev.title),
      jsonb_build_object('status', 'approved', 'replaced_by_submission_id', p_submission_id)
    );
  END IF;

  UPDATE public.tech_submissions
  SET status = 'selected',
      selected_by = v_caller_id,
      selected_at = now(),
      reviewed_by = v_caller_id,
      reviewed_at = now(),
      review_note = COALESCE(p_review_note, review_note),
      updated_at = now()
  WHERE id = p_submission_id;

  INSERT INTO public.audit_log (
    actor_id,
    actor_csi_id,
    action,
    target_type,
    target_id,
    before_state,
    after_state
  ) VALUES (
    v_caller_id,
    v_caller_csi_id,
    'tech_weekly.pick_selected',
    'tech_submissions',
    p_submission_id::text,
    jsonb_build_object('status', v_target.status, 'selected_by', v_target.selected_by, 'title', v_target.title),
    jsonb_build_object('status', 'selected', 'selected_by', v_caller_id, 'replaced_previous_id', v_prev.id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'selected_id', p_submission_id,
    'replaced_id', v_prev.id,
    'week_id', v_target.week_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.select_tech_weekly_pick(uuid, text) TO authenticated;

ALTER TABLE public.tech_submissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tech_submissions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tech_submissions TO authenticated;

DROP POLICY IF EXISTS "Public can view non-draft tech submissions" ON public.tech_submissions;
CREATE POLICY "Public can view non-draft tech submissions"
  ON public.tech_submissions
  FOR SELECT
  TO anon, authenticated
  USING (
    (is_deleted = false AND status IN ('submitted', 'approved', 'selected', 'archived'))
    OR (is_deleted = false AND author_id = auth.uid())
    OR (is_deleted = false AND public.is_tech_head_or_admin(auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Verified tech members can insert submissions" ON public.tech_submissions;
CREATE POLICY "Verified tech members can insert submissions"
  ON public.tech_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      author_id = auth.uid()
      AND public.is_verified_tech_member(auth.uid())
      AND status IN ('draft', 'submitted')
    )
  );

DROP POLICY IF EXISTS "Verified tech members and heads can update submissions" ON public.tech_submissions;
CREATE POLICY "Verified tech members and heads can update submissions"
  ON public.tech_submissions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (is_deleted = false AND author_id = auth.uid() AND public.is_verified_tech_member(auth.uid()))
    OR (is_deleted = false AND public.is_tech_head_or_admin(auth.uid()))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (is_deleted = false AND author_id = auth.uid() AND public.is_verified_tech_member(auth.uid()))
    OR (is_deleted = false AND public.is_tech_head_or_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "Super admin or author before cutoff can delete draft" ON public.tech_submissions;
CREATE POLICY "Super admin or author before cutoff can delete draft"
  ON public.tech_submissions
  FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      author_id = auth.uid()
      AND status = 'draft'
      AND public.is_submission_window_open(week_id)
    )
  );

-- ============================================================================
-- 8. TECH COMMENTS, REACTIONS, AND REPORTS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tech_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.tech_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.tech_comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 2000),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tech_comments_submission_created
  ON public.tech_comments(submission_id, parent_id, created_at ASC);

-- Enforce 1-level threading on tech_comments
CREATE OR REPLACE FUNCTION public.enforce_tech_comment_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent public.tech_comments%ROWTYPE;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT * INTO v_parent FROM public.tech_comments WHERE id = NEW.parent_id;
    IF v_parent.id IS NULL OR v_parent.submission_id <> NEW.submission_id THEN
      RAISE EXCEPTION 'Parent comment does not belong to this submission.';
    END IF;
    IF v_parent.parent_id IS NOT NULL THEN
      RAISE EXCEPTION 'Replies are limited to one nesting level.';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_tech_comment_rules ON public.tech_comments;
CREATE TRIGGER trg_enforce_tech_comment_rules
  BEFORE INSERT OR UPDATE ON public.tech_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tech_comment_rules();

ALTER TABLE public.tech_comments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tech_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tech_comments TO authenticated;

DROP POLICY IF EXISTS "Tech comments are viewable by everyone" ON public.tech_comments;
CREATE POLICY "Tech comments are viewable by everyone"
  ON public.tech_comments
  FOR SELECT
  TO anon, authenticated
  USING (
    is_deleted = false
    OR public.is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Verified tech members can insert tech comments" ON public.tech_comments;
CREATE POLICY "Verified tech members can insert tech comments"
  ON public.tech_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_verified_tech_member(auth.uid())
      OR (
        public.is_verified_roster_member(auth.uid())
        AND COALESCE((SELECT allow_member_comments FROM public.platform_settings WHERE id = 1), false) = true
      )
    )
  );

DROP POLICY IF EXISTS "Authors and super admin can update tech comments" ON public.tech_comments;
CREATE POLICY "Authors and super admin can update tech comments"
  ON public.tech_comments
  FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (is_deleted = false AND user_id = auth.uid() AND public.is_verified_roster_member(auth.uid()))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (is_deleted = false AND user_id = auth.uid() AND public.is_verified_roster_member(auth.uid()))
  );

DROP POLICY IF EXISTS "Authors and super admin can delete tech comments" ON public.tech_comments;
CREATE POLICY "Authors and super admin can delete tech comments"
  ON public.tech_comments
  FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR user_id = auth.uid()
  );

CREATE TABLE IF NOT EXISTS public.tech_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.tech_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'insightful', 'fire')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_tech_reactions_submission
  ON public.tech_reactions(submission_id, reaction_type);

ALTER TABLE public.tech_reactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tech_reactions TO anon, authenticated;
GRANT INSERT, DELETE ON public.tech_reactions TO authenticated;

DROP POLICY IF EXISTS "Tech reactions are viewable by everyone" ON public.tech_reactions;
CREATE POLICY "Tech reactions are viewable by everyone"
  ON public.tech_reactions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can react to tech submissions" ON public.tech_reactions;
CREATE POLICY "Authenticated users can react to tech submissions"
  ON public.tech_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_verified_tech_member(auth.uid())
      OR (reaction_type = 'like' AND NOT COALESCE((SELECT is_suspended FROM public.profiles WHERE id = auth.uid()), false))
    )
  );

DROP POLICY IF EXISTS "Users can remove their own tech reactions" ON public.tech_reactions;
CREATE POLICY "Users can remove their own tech reactions"
  ON public.tech_reactions
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin(auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.tech_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('submission', 'comment', 'post')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(trim(reason)) BETWEEN 3 AND 1000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tech_reports_status_created
  ON public.tech_reports(status, created_at DESC);

ALTER TABLE public.tech_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_reports TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.tech_reports;
CREATE POLICY "Authenticated users can submit reports"
  ON public.tech_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND NOT COALESCE((SELECT is_suspended FROM public.profiles WHERE id = auth.uid()), false)
  );

DROP POLICY IF EXISTS "Reporters and admins can view reports" ON public.tech_reports;
CREATE POLICY "Reporters and admins can view reports"
  ON public.tech_reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid()
    OR public.is_tech_head_or_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Super admin can update or delete reports" ON public.tech_reports;
CREATE POLICY "Super admin can update or delete reports"
  ON public.tech_reports
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ============================================================================
-- 9. LOCK DOWN EXISTING TABLES (POSTS, COMMENTS, NOTIFICATIONS, STORAGE)
-- ============================================================================

-- Restrict posting on public.posts to verified tech members (or super_admin).
-- Existing published posts remain publicly readable.
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
  existing_pick_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RETURN NEW;
  END IF;

  caller_is_admin := public.is_super_admin(caller_id);
  IF caller_is_admin THEN
    RETURN NEW;
  END IF;

  caller_is_tech := public.is_verified_tech_member(caller_id);
  IF NOT caller_is_tech THEN
    RAISE EXCEPTION 'Unauthorized: only verified CSI Technical members can create or update posts.';
  END IF;

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
      public.is_verified_tech_member(auth.uid())
      AND (
        (publication_id IS NULL AND author_id = auth.uid() AND status IN ('draft', 'published'))
        OR (
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

-- Lock down notifications INSERT policy to prevent spoofed notifications
DO $$
DECLARE
  pol_name text;
BEGIN
  FOR pol_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol_name);
  END LOOP;
END $$;

CREATE POLICY "Users can only insert notifications from themselves"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND from_user_id = auth.uid()
    AND user_id <> auth.uid()
    AND type IN (
      'like',
      'comment',
      'reply',
      'follow',
      'review_submitted',
      'review_approved',
      'changes_requested'
    )
  );

-- Lock down storage.objects policies on avatars and post-images buckets:
-- 1. Enforce user folder ownership: (storage.foldername(name))[1] = auth.uid()::text
-- 2. Enforce image extension whitelist (.jpg, .jpeg, .png, .webp, .gif)
-- 3. Enforce 5 MB max file size
-- 4. Keep no listing SELECT policies on public buckets
DO $$
DECLARE
  pol_name text;
BEGIN
  FOR pol_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol_name);
  END LOOP;
END $$;

CREATE POLICY "Users can upload own avatar images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

CREATE POLICY "Users can update own avatar images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

CREATE POLICY "Users can delete own avatar images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_super_admin(auth.uid())
    )
  );

CREATE POLICY "Verified tech members can upload own post images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_verified_tech_member(auth.uid())
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

CREATE POLICY "Verified tech members can update own post images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_verified_tech_member(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_verified_tech_member(auth.uid())
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

CREATE POLICY "Verified tech members can delete own post images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (
      ((storage.foldername(name))[1] = auth.uid()::text AND public.is_verified_tech_member(auth.uid()))
      OR public.is_super_admin(auth.uid())
    )
  );

-- ============================================================================
-- 10. PERFORMANCE INDEXES ON EXISTING TABLES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_posts_status_published_at
  ON public.posts(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_author_status_created_at
  ON public.posts(author_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post_parent_created
  ON public.comments(post_id, parent_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id
  ON public.follows(follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following_id
  ON public.follows(following_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications(user_id, read, created_at DESC);
