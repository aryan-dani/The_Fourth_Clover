-- Fix get_or_create_current_tech_week:
-- 1. ON CONFLICT referenced non-existent updated_at (silent EXCEPTION → stuck on old locked week)
-- 2. Week cycle now opens Friday 09:00 IST (was Sunday 00:00)
-- 3. Cutoff remains configurable via platform_settings (default Wed 09:00 IST)

CREATE OR REPLACE FUNCTION public.get_or_create_current_tech_week()
RETURNS public.tech_weeks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now_ist timestamp without time zone := (now() AT TIME ZONE 'Asia/Kolkata');
  v_dow integer := EXTRACT(DOW FROM v_now_ist)::integer; -- 0=Sun .. 5=Fri .. 6=Sat
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
  -- Friday-anchored week: Fri=5 → 0 days back; Sat=6 → 1; Sun=0 → 2; ... Thu=4 → 6
  v_days_since_friday := (v_dow - 5 + 7) % 7;
  v_friday_ist := date_trunc('day', v_now_ist) - make_interval(days => v_days_since_friday);
  v_week_key := to_char(v_friday_ist, 'YYYY-MM-DD');

  SELECT * INTO v_week FROM public.tech_weeks WHERE week_key = v_week_key LIMIT 1;
  IF v_week.id IS NOT NULL THEN
    RETURN v_week;
  END IF;

  SELECT * INTO v_settings FROM public.platform_settings WHERE id = 1;
  v_cutoff_dow := COALESCE(v_settings.cutoff_day, 3); -- 0=Sun .. 3=Wed (calendar DOW)

  -- Opens Friday 09:00 IST
  v_starts_at := ((v_friday_ist + interval '9 hours') AT TIME ZONE 'Asia/Kolkata');

  -- Cutoff on the configured weekday at configured time (same calendar week as Friday start,
  -- or the following week if cutoff DOW is before Friday).
  IF v_cutoff_dow >= 5 THEN
    -- Fri/Sat cutoff in the same Friday-started week
    v_cutoff_at := ((v_friday_ist
      + make_interval(days => v_cutoff_dow - 5)
      + make_interval(
          hours => COALESCE(v_settings.cutoff_hour_ist, 9),
          mins => COALESCE(v_settings.cutoff_minute_ist, 0)
        )
    ) AT TIME ZONE 'Asia/Kolkata');
  ELSE
    -- Sun–Thu cutoff falls in the days after Friday (e.g. Wed = Friday + 5 days)
    v_cutoff_at := ((v_friday_ist
      + make_interval(days => v_cutoff_dow + 2)
      + make_interval(
          hours => COALESCE(v_settings.cutoff_hour_ist, 9),
          mins => COALESCE(v_settings.cutoff_minute_ist, 0)
        )
    ) AT TIME ZONE 'Asia/Kolkata');
  END IF;

  -- Week ends just before the next Friday 09:00 IST
  v_ends_at := ((v_friday_ist + interval '7 days' + interval '9 hours' - interval '1 second')
    AT TIME ZONE 'Asia/Kolkata');

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

-- Let people submit anytime while heads review (matches chapter feedback).
UPDATE public.platform_settings
SET
  submissions_override = 'force_open',
  updated_at = now()
WHERE id = 1;

-- Keep the active Sunday week open through next Wednesday as a safety net.
UPDATE public.tech_weeks
SET
  cutoff_at = ('2026-10-29 09:00:00'::timestamp AT TIME ZONE 'Asia/Kolkata'),
  ends_at = ('2026-10-30 08:59:59'::timestamp AT TIME ZONE 'Asia/Kolkata'),
  is_locked = false
WHERE week_key = '2026-10-25';
