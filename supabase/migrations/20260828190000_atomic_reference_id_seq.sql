-- 1. Create a dedicated Postgres sequence for continuous, guaranteed unique reference numbers
CREATE SEQUENCE IF NOT EXISTS public.ksaw_reference_seq START WITH 1;

-- Set sequence to start after whatever maximum reference number currently exists
DO $$
DECLARE
  max_val integer := 0;
  r RECORD;
  num_part integer;
BEGIN
  FOR r IN SELECT reference_number FROM public.registrations WHERE reference_number ~* '^KSAW\s*\d+' LOOP
    BEGIN
      num_part := (regexp_replace(r.reference_number, '[^\d]', '', 'g'))::integer;
      IF num_part > max_val THEN
        max_val := num_part;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- ignore format errors
    END;
  END LOOP;

  IF max_val > 0 THEN
    PERFORM setval('public.ksaw_reference_seq', max_val);
  ELSE
    -- If there are N registrations, set sequence to N
    SELECT count(*) INTO max_val FROM public.registrations;
    IF max_val > 0 THEN
      PERFORM setval('public.ksaw_reference_seq', max_val);
    END IF;
  END IF;
END $$;

-- 2. Function to atomically generate the next serial Reference ID (e.g. KSAW 001, KSAW 002, ...)
CREATE OR REPLACE FUNCTION public.get_next_ksaw_reference_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
BEGIN
  next_val := nextval('public.ksaw_reference_seq');
  RETURN 'KSAW ' || LPAD(next_val::text, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_ksaw_reference_id() TO anon, authenticated;

-- 3. Notify schema reload
NOTIFY pgrst, 'reload schema';
