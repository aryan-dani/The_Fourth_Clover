-- Expand search_content to match authors and pieces by author name.

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
        OR COALESCE(a.username, '') ILIKE '%' || qn.term || '%'
        OR COALESCE(a.full_name, '') ILIKE '%' || qn.term || '%'
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
