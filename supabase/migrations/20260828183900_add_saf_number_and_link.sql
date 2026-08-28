-- Add saf_number column to registrations table if not already added
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS saf_number text;

-- Create index on saf_number for quick lookup
CREATE INDEX IF NOT EXISTS registrations_saf_number_idx ON public.registrations (saf_number);

-- Function to search registrations for linking
CREATE OR REPLACE FUNCTION public.search_registrations_for_link(search_term text)
RETURNS TABLE (
  reference_number text,
  first_name text,
  last_name text,
  phone text,
  email text,
  saf_number text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    reference_number,
    first_name,
    last_name,
    phone,
    email,
    saf_number
  FROM public.registrations
  WHERE reference_number IS NOT NULL
    AND (
      UPPER(reference_number) ILIKE '%' || UPPER(TRIM(search_term)) || '%'
      OR UPPER(first_name) ILIKE '%' || UPPER(TRIM(search_term)) || '%'
      OR UPPER(last_name) ILIKE '%' || UPPER(TRIM(search_term)) || '%'
      OR phone ILIKE '%' || TRIM(search_term) || '%'
    )
  ORDER BY created_at DESC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.search_registrations_for_link(text) TO anon, authenticated;

-- Function to link SAF number to registration
CREATE OR REPLACE FUNCTION public.link_saf_number(ref_id text, saf_num text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.registrations
  SET
    saf_number = TRIM(saf_num),
    updated_at = now()
  WHERE UPPER(TRIM(reference_number)) = UPPER(TRIM(ref_id));

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_saf_number(text, text) TO anon, authenticated;
