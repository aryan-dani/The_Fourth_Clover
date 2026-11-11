-- Atomic review status update for Technical Heads / Super Admin.
-- Mirrors select_tech_weekly_pick: SECURITY DEFINER so curation is not blocked
-- by client RLS edge cases once auth.uid() is present.
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
  WHERE id = p_submission_id
    AND is_deleted = false
  FOR UPDATE;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Submission not found.';
  END IF;

  IF v_target.status = 'draft' THEN
    RAISE EXCEPTION 'Drafts cannot be reviewed until they are submitted.';
  END IF;

  -- Bypass enforce_tech_submission_rules head/author transition checks;
  -- this RPC is the authorized curation path.
  PERFORM set_config('app.internal_role_sync', 'on', true);

  UPDATE public.tech_submissions
  SET status = p_status,
      review_note = COALESCE(p_review_note, review_note),
      reviewed_by = v_caller_id,
      reviewed_at = now(),
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
    'tech_weekly.review_' || p_status,
    'tech_submissions',
    p_submission_id::text,
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

GRANT EXECUTE ON FUNCTION public.review_tech_submission(uuid, text, text) TO authenticated;
