-- Public curation RPCs require auth.uid().
-- admin_* variants are service_role-only and take an explicit verified actor id.

CREATE OR REPLACE FUNCTION public.review_tech_submission(
  p_submission_id uuid,
  p_status text,
  p_review_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_csi_id integer;
  v_target public.tech_submissions%ROWTYPE;
BEGIN
  IF v_caller_id IS NULL OR NOT public.is_tech_head_or_admin(v_caller_id) THEN
    RAISE EXCEPTION 'Unauthorized: only Technical Heads or Super Admin can review Tech Weekly submissions.';
  END IF;

  IF p_status NOT IN ('approved', 'rejected', 'submitted') THEN
    RAISE EXCEPTION 'Invalid review status. Use approved, rejected, or submitted.';
  END IF;

  SELECT csi_id INTO v_caller_csi_id FROM public.profiles WHERE id = v_caller_id;

  SELECT * INTO v_target
  FROM public.tech_submissions
  WHERE id = p_submission_id AND is_deleted = false
  FOR UPDATE;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Submission not found.';
  END IF;

  IF v_target.status = 'draft' THEN
    RAISE EXCEPTION 'Drafts cannot be reviewed until they are submitted.';
  END IF;

  PERFORM set_config('app.internal_role_sync', 'on', true);

  UPDATE public.tech_submissions
  SET status = p_status,
      review_note = COALESCE(p_review_note, review_note),
      reviewed_by = v_caller_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_submission_id;

  INSERT INTO public.audit_log (actor_id, actor_csi_id, action, target_type, target_id, before_state, after_state)
  VALUES (
    v_caller_id, v_caller_csi_id, 'tech_weekly.review_' || p_status, 'tech_submissions', p_submission_id::text,
    jsonb_build_object('status', v_target.status, 'review_note', v_target.review_note),
    jsonb_build_object('status', p_status, 'review_note', COALESCE(p_review_note, v_target.review_note))
  );

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'status', p_status,
    'slug', v_target.slug,
    'title', v_target.title,
    'author_id', v_target.author_id
  );
END;
$function$;

DROP FUNCTION IF EXISTS public.review_tech_submission(uuid, text, text, uuid);

CREATE OR REPLACE FUNCTION public.admin_review_tech_submission(
  p_actor_id uuid,
  p_submission_id uuid,
  p_status text,
  p_review_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_csi_id integer;
  v_target public.tech_submissions%ROWTYPE;
BEGIN
  IF p_actor_id IS NULL OR NOT public.is_tech_head_or_admin(p_actor_id) THEN
    RAISE EXCEPTION 'Unauthorized: only Technical Heads or Super Admin can review Tech Weekly submissions.';
  END IF;

  IF p_status NOT IN ('approved', 'rejected', 'submitted') THEN
    RAISE EXCEPTION 'Invalid review status. Use approved, rejected, or submitted.';
  END IF;

  SELECT csi_id INTO v_caller_csi_id FROM public.profiles WHERE id = p_actor_id;

  SELECT * INTO v_target
  FROM public.tech_submissions
  WHERE id = p_submission_id AND is_deleted = false
  FOR UPDATE;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Submission not found.';
  END IF;

  IF v_target.status = 'draft' THEN
    RAISE EXCEPTION 'Drafts cannot be reviewed until they are submitted.';
  END IF;

  PERFORM set_config('app.internal_role_sync', 'on', true);

  UPDATE public.tech_submissions
  SET status = p_status,
      review_note = COALESCE(p_review_note, review_note),
      reviewed_by = p_actor_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_submission_id;

  INSERT INTO public.audit_log (actor_id, actor_csi_id, action, target_type, target_id, before_state, after_state)
  VALUES (
    p_actor_id, v_caller_csi_id, 'tech_weekly.review_' || p_status, 'tech_submissions', p_submission_id::text,
    jsonb_build_object('status', v_target.status, 'review_note', v_target.review_note),
    jsonb_build_object('status', p_status, 'review_note', COALESCE(p_review_note, v_target.review_note))
  );

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'status', p_status,
    'slug', v_target.slug,
    'title', v_target.title,
    'author_id', v_target.author_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_review_tech_submission(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_review_tech_submission(uuid, uuid, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_tech_submission(uuid, uuid, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.select_tech_weekly_pick(
  p_submission_id uuid,
  p_review_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  WHERE id = p_submission_id AND is_deleted = false
  FOR UPDATE;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Submission not found.';
  END IF;

  IF v_target.status = 'draft' THEN
    RAISE EXCEPTION 'Drafts cannot be selected as the Weekly LinkedIn Pick.';
  END IF;

  PERFORM set_config('app.internal_role_sync', 'on', true);

  SELECT * INTO v_prev
  FROM public.tech_submissions
  WHERE week_id = v_target.week_id
    AND status = 'selected'
    AND is_deleted = false
    AND id <> p_submission_id
  FOR UPDATE;

  IF v_prev.id IS NOT NULL THEN
    UPDATE public.tech_submissions
    SET status = 'approved', updated_at = now()
    WHERE id = v_prev.id;

    INSERT INTO public.audit_log (actor_id, actor_csi_id, action, target_type, target_id, before_state, after_state)
    VALUES (
      v_caller_id, v_caller_csi_id, 'tech_weekly.pick_replaced', 'tech_submissions', v_prev.id::text,
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

  INSERT INTO public.audit_log (actor_id, actor_csi_id, action, target_type, target_id, before_state, after_state)
  VALUES (
    v_caller_id, v_caller_csi_id, 'tech_weekly.pick_selected', 'tech_submissions', p_submission_id::text,
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
$function$;

DROP FUNCTION IF EXISTS public.select_tech_weekly_pick(uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.admin_select_tech_weekly_pick(
  p_actor_id uuid,
  p_submission_id uuid,
  p_review_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_csi_id integer;
  v_target public.tech_submissions%ROWTYPE;
  v_prev public.tech_submissions%ROWTYPE;
BEGIN
  IF p_actor_id IS NULL OR NOT public.is_tech_head_or_admin(p_actor_id) THEN
    RAISE EXCEPTION 'Unauthorized: only Technical Heads (CSI IDs 241, 246) or Super Admin (303) can select the Weekly LinkedIn Pick.';
  END IF;

  SELECT csi_id INTO v_caller_csi_id FROM public.profiles WHERE id = p_actor_id;

  SELECT * INTO v_target
  FROM public.tech_submissions
  WHERE id = p_submission_id AND is_deleted = false
  FOR UPDATE;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Submission not found.';
  END IF;

  IF v_target.status = 'draft' THEN
    RAISE EXCEPTION 'Drafts cannot be selected as the Weekly LinkedIn Pick.';
  END IF;

  PERFORM set_config('app.internal_role_sync', 'on', true);

  SELECT * INTO v_prev
  FROM public.tech_submissions
  WHERE week_id = v_target.week_id
    AND status = 'selected'
    AND is_deleted = false
    AND id <> p_submission_id
  FOR UPDATE;

  IF v_prev.id IS NOT NULL THEN
    UPDATE public.tech_submissions
    SET status = 'approved', updated_at = now()
    WHERE id = v_prev.id;

    INSERT INTO public.audit_log (actor_id, actor_csi_id, action, target_type, target_id, before_state, after_state)
    VALUES (
      p_actor_id, v_caller_csi_id, 'tech_weekly.pick_replaced', 'tech_submissions', v_prev.id::text,
      jsonb_build_object('status', 'selected', 'selected_by', v_prev.selected_by, 'title', v_prev.title),
      jsonb_build_object('status', 'approved', 'replaced_by_submission_id', p_submission_id)
    );
  END IF;

  UPDATE public.tech_submissions
  SET status = 'selected',
      selected_by = p_actor_id,
      selected_at = now(),
      reviewed_by = p_actor_id,
      reviewed_at = now(),
      review_note = COALESCE(p_review_note, review_note),
      updated_at = now()
  WHERE id = p_submission_id;

  INSERT INTO public.audit_log (actor_id, actor_csi_id, action, target_type, target_id, before_state, after_state)
  VALUES (
    p_actor_id, v_caller_csi_id, 'tech_weekly.pick_selected', 'tech_submissions', p_submission_id::text,
    jsonb_build_object('status', v_target.status, 'selected_by', v_target.selected_by, 'title', v_target.title),
    jsonb_build_object('status', 'selected', 'selected_by', p_actor_id, 'replaced_previous_id', v_prev.id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'selected_id', p_submission_id,
    'replaced_id', v_prev.id,
    'week_id', v_target.week_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_select_tech_weekly_pick(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_select_tech_weekly_pick(uuid, uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_select_tech_weekly_pick(uuid, uuid, text) TO service_role;

GRANT EXECUTE ON FUNCTION public.review_tech_submission(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.select_tech_weekly_pick(uuid, text) TO authenticated;
