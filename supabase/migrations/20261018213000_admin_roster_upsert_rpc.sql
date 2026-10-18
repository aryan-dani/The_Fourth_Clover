-- ============================================================================
-- Migration: Super Admin Roster Upsert & Delete RPCs
-- Allows Super Admin (CSI ID 303) to add, update, or remove CSI roster entries
-- directly from the Admin Console without exposing service_role keys.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_upsert_csi_roster_entry(
  p_csi_id integer,
  p_name text,
  p_dept text,
  p_year text DEFAULT NULL,
  p_prn_hash text DEFAULT NULL,
  p_prn_missing boolean DEFAULT false,
  p_prn_duplicate boolean DEFAULT false,
  p_role text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  resolved_dept text;
  resolved_role text;
  existing_row public.csi_roster%ROWTYPE;
BEGIN
  IF caller_id IS NOT NULL AND NOT public.is_super_admin(caller_id) THEN
    RAISE EXCEPTION 'Only Super Admin can manage CSI roster rows.';
  END IF;

  IF p_csi_id IS NULL OR p_csi_id <= 0 THEN
    RAISE EXCEPTION 'CSI ID must be a positive integer.';
  END IF;

  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Member name is required.';
  END IF;

  resolved_dept := COALESCE(NULLIF(btrim(p_dept), ''), 'Tech');
  IF lower(resolved_dept) LIKE '%tech%' THEN
    resolved_dept := 'Tech';
  END IF;

  IF p_csi_id = 303 THEN
    resolved_role := 'super_admin';
    resolved_dept := 'Tech';
  ELSIF p_csi_id IN (241, 246) THEN
    resolved_role := 'tech_head';
    resolved_dept := 'Tech';
  ELSIF p_role IN ('super_admin', 'tech_head', 'tech_member', 'member') THEN
    resolved_role := p_role;
  ELSIF resolved_dept = 'Tech' THEN
    resolved_role := 'tech_member';
  ELSE
    resolved_role := 'member';
  END IF;

  SELECT * INTO existing_row
  FROM public.csi_roster
  WHERE csi_id = p_csi_id;

  INSERT INTO public.csi_roster (
    csi_id,
    name,
    dept,
    year,
    prn_hash,
    prn_missing,
    prn_duplicate,
    role,
    updated_at
  )
  VALUES (
    p_csi_id,
    btrim(p_name),
    resolved_dept,
    NULLIF(btrim(COALESCE(p_year, '')), ''),
    COALESCE(p_prn_hash, existing_row.prn_hash),
    CASE
      WHEN p_prn_hash IS NOT NULL THEN p_prn_missing
      WHEN existing_row.csi_id IS NOT NULL THEN existing_row.prn_missing
      ELSE true
    END,
    COALESCE(p_prn_duplicate, existing_row.prn_duplicate, false),
    resolved_role,
    now()
  )
  ON CONFLICT (csi_id) DO UPDATE
  SET
    name = EXCLUDED.name,
    dept = EXCLUDED.dept,
    year = COALESCE(EXCLUDED.year, public.csi_roster.year),
    prn_hash = COALESCE(EXCLUDED.prn_hash, public.csi_roster.prn_hash),
    prn_missing = EXCLUDED.prn_missing,
    prn_duplicate = EXCLUDED.prn_duplicate,
    role = EXCLUDED.role,
    updated_at = now();

  -- If this CSI ID is already claimed by a profile, keep their profile role/dept/year synced
  PERFORM set_config('app.internal_role_sync', 'on', true);

  UPDATE public.profiles
  SET
    role = resolved_role,
    is_admin = (resolved_role = 'super_admin'),
    dept = resolved_dept,
    year = COALESCE(NULLIF(btrim(COALESCE(p_year, '')), ''), year),
    updated_at = now()
  WHERE csi_id = p_csi_id;

  INSERT INTO public.audit_log (
    actor_id,
    actor_csi_id,
    action,
    target_type,
    target_id,
    after_state
  )
  VALUES (
    caller_id,
    303,
    'admin_upsert_roster_entry',
    'csi_roster',
    p_csi_id::text,
    jsonb_build_object(
      'csi_id', p_csi_id,
      'name', btrim(p_name),
      'dept', resolved_dept,
      'year', p_year,
      'role', resolved_role
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'csi_id', p_csi_id,
    'role', resolved_role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_csi_roster_entry(
  p_csi_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  existing_row public.csi_roster%ROWTYPE;
BEGIN
  IF caller_id IS NOT NULL AND NOT public.is_super_admin(caller_id) THEN
    RAISE EXCEPTION 'Only Super Admin can delete CSI roster rows.';
  END IF;

  IF p_csi_id = 303 THEN
    RAISE EXCEPTION 'Cannot delete Super Admin CSI ID 303 from roster.';
  END IF;

  SELECT * INTO existing_row
  FROM public.csi_roster
  WHERE csi_id = p_csi_id;

  IF existing_row.csi_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Roster entry not found.');
  END IF;

  PERFORM set_config('app.internal_role_sync', 'on', true);

  IF existing_row.claimed_by IS NOT NULL THEN
    UPDATE public.profiles
    SET
      csi_id = NULL,
      role = 'unverified',
      is_admin = false,
      dept = NULL,
      year = NULL,
      updated_at = now()
    WHERE id = existing_row.claimed_by;
  END IF;

  DELETE FROM public.csi_roster WHERE csi_id = p_csi_id;

  INSERT INTO public.audit_log (
    actor_id,
    actor_csi_id,
    action,
    target_type,
    target_id,
    before_state
  )
  VALUES (
    caller_id,
    303,
    'admin_delete_roster_entry',
    'csi_roster',
    p_csi_id::text,
    jsonb_build_object(
      'csi_id', existing_row.csi_id,
      'name', existing_row.name,
      'dept', existing_row.dept,
      'role', existing_row.role
    )
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_csi_roster_entry(integer, text, text, text, text, boolean, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_csi_roster_entry(integer) TO authenticated;
