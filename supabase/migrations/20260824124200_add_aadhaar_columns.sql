ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS aadhaar_number text,
ADD COLUMN IF NOT EXISTS aadhaar_proof text,
ADD COLUMN IF NOT EXISTS caste_sub_category text;
