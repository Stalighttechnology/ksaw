-- ==============================================================================
-- DATABASE MIGRATION: HIGH-PERFORMANCE READ-ONLY ADMIN DASHBOARD AGGREGATION RPC
-- ==============================================================================

-- 1. Create read-only dashboard aggregation function (100% non-destructive)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total', (SELECT count(*) FROM public.registrations),
    'today', (SELECT count(*) FROM public.registrations WHERE created_at >= CURRENT_DATE),
    'week',  (SELECT count(*) FROM public.registrations WHERE created_at >= (CURRENT_DATE - INTERVAL '6 days')),
    'byStatus', (
      SELECT coalesce(json_object_agg(coalesce(status, 'Pending'), cnt), '{}'::json)
      FROM (
        SELECT status, count(*) as cnt
        FROM public.registrations
        GROUP BY status
      ) s
    ),
    'byGender', (
      SELECT coalesce(json_object_agg(gender, cnt), '{}'::json)
      FROM (
        SELECT gender, count(*) as cnt
        FROM public.registrations
        WHERE gender IS NOT NULL AND gender != ''
        GROUP BY gender
      ) g
    ),
    'byCourse', (
      SELECT coalesce(json_object_agg(skill_sought, cnt), '{}'::json)
      FROM (
        SELECT skill_sought, count(*) as cnt
        FROM public.registrations
        WHERE skill_sought IS NOT NULL AND skill_sought != ''
        GROUP BY skill_sought
      ) c
    ),
    'byCenter', (
      SELECT coalesce(json_object_agg(center, cnt), '{}'::json)
      FROM (
        SELECT coalesce(center_location, cur_district) as center, count(*) as cnt
        FROM public.registrations
        WHERE (center_location IS NOT NULL AND center_location != '')
           OR (cur_district IS NOT NULL AND cur_district != '')
        GROUP BY 1
      ) l
    ),
    'byPartner', (
      SELECT coalesce(json_object_agg(institution_name, cnt), '{}'::json)
      FROM (
        SELECT institution_name, count(*) as cnt
        FROM public.registrations
        WHERE institution_name IS NOT NULL AND institution_name != ''
        GROUP BY institution_name
      ) p
    ),
    'byNigama', (
      SELECT coalesce(json_object_agg(nigama, cnt), '{}'::json)
      FROM (
        SELECT nigama, count(*) as cnt
        FROM public.registrations
        WHERE nigama IS NOT NULL AND nigama != ''
        GROUP BY nigama
      ) n
    )
  );
$$;

-- 2. Add standard read-only lookup indexes to accelerate table queries and sorting
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_skill_sought ON public.registrations(skill_sought);
CREATE INDEX IF NOT EXISTS idx_registrations_institution ON public.registrations(institution_name);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations(phone);
CREATE INDEX IF NOT EXISTS idx_registrations_aadhaar ON public.registrations(aadhaar_number);

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO anon, authenticated, service_role;

-- 4. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
