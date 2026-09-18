-- ==============================================================================
-- DATABASE MIGRATION: ENFORCE STRICT UNIQUE REFERENCE IDS & ADVANCE SEQUENCE
-- ==============================================================================

-- 1. Ensure dedicated Postgres sequence exists and advance past highest existing ID (2700)
CREATE SEQUENCE IF NOT EXISTS public.ksaw_reference_seq START WITH 2700;

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

  IF max_val >= 2700 THEN
    PERFORM setval('public.ksaw_reference_seq', max_val);
  ELSE
    PERFORM setval('public.ksaw_reference_seq', 2700);
  END IF;
END $$;

-- 2. Trigger function to assign guaranteed unique serial Reference ID BEFORE INSERT
CREATE OR REPLACE FUNCTION public.set_registration_reference_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exists_count integer := 0;
BEGIN
  -- If reference_number is empty, null, or already taken in the database, assign next atomic sequence
  IF NEW.reference_number IS NULL OR TRIM(NEW.reference_number) = '' THEN
    NEW.reference_number := 'KSAW ' || LPAD(nextval('public.ksaw_reference_seq')::text, 3, '0');
  ELSE
    SELECT count(*) INTO exists_count FROM public.registrations WHERE reference_number = NEW.reference_number;
    IF exists_count > 0 THEN
      -- Collision prevention: auto-assign unique atomic sequence
      NEW.reference_number := 'KSAW ' || LPAD(nextval('public.ksaw_reference_seq')::text, 3, '0');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Attach trigger to registrations table
DROP TRIGGER IF EXISTS trg_set_registration_reference_number ON public.registrations;
CREATE TRIGGER trg_set_registration_reference_number
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.set_registration_reference_number();

-- 4. Function to atomically retrieve next Reference ID
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

-- 5. Create strict UNIQUE INDEX on reference_number to guarantee database integrity
CREATE UNIQUE INDEX IF NOT EXISTS registrations_reference_number_unique_idx ON public.registrations (reference_number);

-- 6. Grant sequence and function permissions
GRANT USAGE, SELECT ON SEQUENCE public.ksaw_reference_seq TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_registration_reference_number() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_ksaw_reference_id() TO anon, authenticated;

-- 7. Notify schema reload
NOTIFY pgrst, 'reload schema';
