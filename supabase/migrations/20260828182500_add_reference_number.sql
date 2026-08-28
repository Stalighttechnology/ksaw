-- Add reference_number column to registrations table if not already added
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS reference_number text;

-- Create index on reference_number for quick lookup
CREATE INDEX IF NOT EXISTS registrations_reference_number_idx ON public.registrations (reference_number);
