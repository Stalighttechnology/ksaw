-- ==============================================================================
-- DATABASE TRIGGER & SEQUENCE: GUARANTEED UNIQUE SERIAL REFERENCE IDS
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Create a dedicated Postgres sequence
CREATE SEQUENCE IF NOT EXISTS public.ksaw_reference_seq START WITH 1;

-- 2. Trigger function to assign guaranteed serial Reference ID BEFORE INSERT
CREATE OR REPLACE FUNCTION public.set_registration_reference_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If reference_number is not set or empty, assign next sequential value
  IF NEW.reference_number IS NULL OR TRIM(NEW.reference_number) = '' THEN
    NEW.reference_number := 'KSAW ' || LPAD(nextval('public.ksaw_reference_seq')::text, 3, '0');
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

-- 4. Re-sequence all existing registrations in chronological order (KSAW 001, KSAW 002, KSAW 003...)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM public.registrations
)
UPDATE public.registrations r
SET reference_number = 'KSAW ' || LPAD(numbered.row_num::text, 3, '0')
FROM numbered
WHERE r.id = numbered.id;

-- 5. Advance sequence past the highest existing number
DO $$
DECLARE
  total_records integer;
BEGIN
  SELECT count(*) INTO total_records FROM public.registrations;
  IF total_records > 0 THEN
    PERFORM setval('public.ksaw_reference_seq', total_records);
  ELSE
    PERFORM setval('public.ksaw_reference_seq', 1, false);
  END IF;
END $$;

-- 6. Grant sequence and function permissions
GRANT USAGE, SELECT ON SEQUENCE public.ksaw_reference_seq TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_registration_reference_number() TO anon, authenticated;

-- 7. Reload schema cache
NOTIFY pgrst, 'reload schema';
