ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS institution_name text,
ADD COLUMN IF NOT EXISTS center_location text;
