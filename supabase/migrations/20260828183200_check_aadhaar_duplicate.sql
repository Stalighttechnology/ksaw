-- Function to check if an Aadhaar number is already registered (returns existing reference_number if found)
CREATE OR REPLACE FUNCTION public.check_aadhaar_registered(aadhaar_num text, exclude_ref text DEFAULT NULL)
RETURNS TABLE (reference_number text, first_name text, last_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT reference_number, first_name, last_name
  FROM public.registrations
  WHERE TRIM(aadhaar_number) = TRIM(aadhaar_num)
    AND (exclude_ref IS NULL OR UPPER(TRIM(COALESCE(reference_number, ''))) != UPPER(TRIM(exclude_ref)))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.check_aadhaar_registered(text, text) TO anon, authenticated;
