-- Enforce one assessment attempt per SAF ID on amrutha_munnade_assessment

-- 1. Remove any duplicate rows by normalized SAF ID (keep earliest submission) before creating unique index
DELETE FROM public.amrutha_munnade_assessment a
USING public.amrutha_munnade_assessment b
WHERE UPPER(TRIM(a.saf_id)) = UPPER(TRIM(b.saf_id))
  AND (
    a.created_at > b.created_at
    OR (a.created_at = b.created_at AND a.id > b.id)
  );

-- 2. Enforce uniqueness on normalized SAF ID (case-insensitive, trimmed)
CREATE UNIQUE INDEX IF NOT EXISTS amrutha_munnade_assessment_unique_saf_id_idx
  ON public.amrutha_munnade_assessment (UPPER(TRIM(saf_id)));

-- 3. RPC to safely check whether a SAF ID has already completed the assessment
CREATE OR REPLACE FUNCTION public.check_saf_assessment_completed(p_saf_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.amrutha_munnade_assessment
    WHERE UPPER(TRIM(saf_id)) = UPPER(TRIM(p_saf_id))
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_saf_assessment_completed(text) TO anon, authenticated;

