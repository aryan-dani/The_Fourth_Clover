-- Open CSI Tech Weekly write / comment / react to every verified roster member.
-- Technical Heads and Super Admin still own review, selection, and LinkedIn pick.

-- ---------------------------------------------------------------------------
-- Submission enforce trigger: verified roster (not Tech-only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_tech_submission_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_internal_sync text := current_setting('app.internal_role_sync', true);
  v_is_head boolean := false;
  v_is_roster boolean := false;
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

  v_is_roster := public.is_verified_roster_member(v_caller_id);
  v_is_head := public.is_tech_head_or_admin(v_caller_id);

  IF NOT v_is_roster THEN
    RAISE EXCEPTION 'Unauthorized: only verified CSI members can create or update Tech Weekly submissions.';
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

-- ---------------------------------------------------------------------------
-- RLS: submissions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Verified tech members can insert submissions" ON public.tech_submissions;
DROP POLICY IF EXISTS "Verified roster members can insert submissions" ON public.tech_submissions;
CREATE POLICY "Verified roster members can insert submissions"
  ON public.tech_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      author_id = auth.uid()
      AND public.is_verified_roster_member(auth.uid())
      AND status IN ('draft', 'submitted')
    )
  );

DROP POLICY IF EXISTS "Verified tech members and heads can update submissions" ON public.tech_submissions;
DROP POLICY IF EXISTS "Verified roster members and heads can update submissions" ON public.tech_submissions;
CREATE POLICY "Verified roster members and heads can update submissions"
  ON public.tech_submissions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (is_deleted = false AND author_id = auth.uid() AND public.is_verified_roster_member(auth.uid()))
    OR (is_deleted = false AND public.is_tech_head_or_admin(auth.uid()))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (is_deleted = false AND author_id = auth.uid() AND public.is_verified_roster_member(auth.uid()))
    OR (is_deleted = false AND public.is_tech_head_or_admin(auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- RLS: comments — any verified CSI member (no settings toggle gate)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Verified tech members can insert tech comments" ON public.tech_comments;
DROP POLICY IF EXISTS "Verified roster members can insert tech comments" ON public.tech_comments;
CREATE POLICY "Verified roster members can insert tech comments"
  ON public.tech_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_verified_roster_member(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- RLS: reactions — any verified CSI member for all reaction types
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can react to tech submissions" ON public.tech_reactions;
DROP POLICY IF EXISTS "Verified roster members can react to tech submissions" ON public.tech_reactions;
CREATE POLICY "Verified roster members can react to tech submissions"
  ON public.tech_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_verified_roster_member(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Storage: cover / inline images for any verified roster member
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Verified tech members can upload own post images" ON storage.objects;
DROP POLICY IF EXISTS "Verified roster members can upload own post images" ON storage.objects;
CREATE POLICY "Verified roster members can upload own post images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_verified_roster_member(auth.uid())
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

DROP POLICY IF EXISTS "Verified tech members can update own post images" ON storage.objects;
DROP POLICY IF EXISTS "Verified roster members can update own post images" ON storage.objects;
CREATE POLICY "Verified roster members can update own post images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_verified_roster_member(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_verified_roster_member(auth.uid())
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

DROP POLICY IF EXISTS "Verified tech members can delete own post images" ON storage.objects;
DROP POLICY IF EXISTS "Verified roster members can delete own post images" ON storage.objects;
CREATE POLICY "Verified roster members can delete own post images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (
      ((storage.foldername(name))[1] = auth.uid()::text AND public.is_verified_roster_member(auth.uid()))
      OR public.is_super_admin(auth.uid())
    )
  );

-- Default: verified members can comment (toggle kept for admin UI, no longer required)
UPDATE public.platform_settings
SET allow_member_comments = true
WHERE id = 1;
