-- Create separate table for Amrutha Munnade Assessment results
CREATE TABLE IF NOT EXISTS public.amrutha_munnade_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  candidate_name text NOT NULL,
  saf_id text NOT NULL,
  college_name text NOT NULL,

  total_questions integer NOT NULL DEFAULT 25,
  attempted_count integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  score_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,

  started_at timestamptz NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 3600,
  time_taken_seconds integer NOT NULL DEFAULT 0,
  submission_reason text NOT NULL DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS amrutha_munnade_assessment_created_at_idx
  ON public.amrutha_munnade_assessment (created_at DESC);

CREATE INDEX IF NOT EXISTS amrutha_munnade_assessment_saf_id_idx
  ON public.amrutha_munnade_assessment (saf_id);

GRANT INSERT ON public.amrutha_munnade_assessment TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amrutha_munnade_assessment TO authenticated;
GRANT ALL ON public.amrutha_munnade_assessment TO service_role;

ALTER TABLE public.amrutha_munnade_assessment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit amrutha munnade assessment" ON public.amrutha_munnade_assessment;
CREATE POLICY "Anyone can submit amrutha munnade assessment"
  ON public.amrutha_munnade_assessment
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view amrutha munnade assessments" ON public.amrutha_munnade_assessment;
CREATE POLICY "Admins can view amrutha munnade assessments"
  ON public.amrutha_munnade_assessment
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Admins can delete amrutha munnade assessments" ON public.amrutha_munnade_assessment;
CREATE POLICY "Admins can delete amrutha munnade assessments"
  ON public.amrutha_munnade_assessment
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR auth.role() = 'authenticated'
  );

