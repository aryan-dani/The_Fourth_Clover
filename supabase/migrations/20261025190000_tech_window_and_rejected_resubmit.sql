-- Align submission window checks with Friday-anchored weeks:
-- trust tech_weeks.starts_at / cutoff_at (and force_open/closed), drop Sunday DOW gate.
-- Allow authors to resubmit rejected manuscripts in place.
-- Reconcile existing week rows when get_or_create finds a stale week_key.

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

  -- Match client computeIsWindowOpen: timestamps only (no Sunday DOW gate)
  IF now() < v_week.starts_at OR now() >= v_week.cutoff_at THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_submission_window_open(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_or_create_current_tech_week()
RETURNS public.tech_weeks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now_ist timestamp without time zone := (now() AT TIME ZONE 'Asia/Kolkata');
  v_dow integer := EXTRACT(DOW FROM v_now_ist)::integer;
  v_days_since_friday integer;
  v_friday_ist timestamp without time zone;
  v_week_key text;
  v_starts_at timestamptz;
  v_cutoff_at timestamptz;
  v_ends_at timestamptz;
  v_settings public.platform_settings%ROWTYPE;
  v_week public.tech_weeks%ROWTYPE;
  v_count integer;
  v_cutoff_dow integer;
BEGIN
  v_days_since_friday := (v_dow - 5 + 7) % 7;
  v_friday_ist := date_trunc('day', v_now_ist) - make_interval(days => v_days_since_friday);
  v_week_key := to_char(v_friday_ist, 'YYYY-MM-DD');

  SELECT * INTO v_settings FROM public.platform_settings WHERE id = 1;
  v_cutoff_dow := COALESCE(v_settings.cutoff_day, 3);

  v_starts_at := ((v_friday_ist + interval '9 hours') AT TIME ZONE 'Asia/Kolkata');

  IF v_cutoff_dow >= 5 THEN
    v_cutoff_at := ((v_friday_ist
      + make_interval(days => v_cutoff_dow - 5)
      + make_interval(
          hours => COALESCE(v_settings.cutoff_hour_ist, 9),
          mins => COALESCE(v_settings.cutoff_minute_ist, 0)
        )
    ) AT TIME ZONE 'Asia/Kolkata');
  ELSE
    v_cutoff_at := ((v_friday_ist
      + make_interval(days => v_cutoff_dow + 2)
      + make_interval(
          hours => COALESCE(v_settings.cutoff_hour_ist, 9),
          mins => COALESCE(v_settings.cutoff_minute_ist, 0)
        )
    ) AT TIME ZONE 'Asia/Kolkata');
  END IF;

  v_ends_at := ((v_friday_ist + interval '7 days' + interval '9 hours' - interval '1 second')
    AT TIME ZONE 'Asia/Kolkata');

  SELECT * INTO v_week FROM public.tech_weeks WHERE week_key = v_week_key LIMIT 1;
  IF v_week.id IS NOT NULL THEN
    UPDATE public.tech_weeks
    SET
      starts_at = v_starts_at,
      cutoff_at = v_cutoff_at,
      ends_at = v_ends_at,
      is_locked = false
    WHERE id = v_week.id
      AND (
        starts_at IS DISTINCT FROM v_starts_at
        OR cutoff_at IS DISTINCT FROM v_cutoff_at
        OR ends_at IS DISTINCT FROM v_ends_at
        OR is_locked = true
      );

    SELECT * INTO v_week FROM public.tech_weeks WHERE week_key = v_week_key LIMIT 1;
    RETURN v_week;
  END IF;

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
    'CSI Tech Weekly: Week of ' || to_char(v_friday_ist, 'FMMon DD, YYYY'),
    'Share a technical deep-dive, system design breakdown, or engineering tutorial with the CSI MIT-WPU community.',
    v_starts_at,
    v_cutoff_at,
    v_ends_at
  )
  ON CONFLICT (week_key) DO NOTHING;

  SELECT * INTO v_week FROM public.tech_weeks WHERE week_key = v_week_key LIMIT 1;
  IF v_week.id IS NOT NULL THEN
    RETURN v_week;
  END IF;

  SELECT * INTO v_week FROM public.tech_weeks ORDER BY starts_at DESC LIMIT 1;
  RETURN v_week;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_current_tech_week() TO anon, authenticated;

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

  IF NEW.status = 'submitted'
     AND (TG_OP = 'INSERT' OR OLD.status IN ('draft', 'rejected'))
     AND NEW.submitted_at IS NULL THEN
    NEW.submitted_at := now();
  END IF;

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
      RAISE EXCEPTION 'Submissions for this week are locked.';
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

    -- Author updating draft/submitted, or resubmitting a rejected manuscript
    IF OLD.author_id = v_caller_id
       AND NEW.status IN ('draft', 'submitted')
       AND OLD.status IN ('draft', 'submitted', 'rejected') THEN
      IF NOT public.is_submission_window_open(NEW.week_id) THEN
        RAISE EXCEPTION 'The submission window is closed. Submissions are locked for editing.';
      END IF;
      IF OLD.status = 'rejected' THEN
        NEW.reviewed_by := NULL;
        NEW.reviewed_at := NULL;
      END IF;
      RETURN NEW;
    END IF;

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
