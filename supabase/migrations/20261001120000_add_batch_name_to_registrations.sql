-- Add batch_name column to registrations table if not already present
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS batch_name text;

-- Create index on batch_name for fast lookup and filtering
CREATE INDEX IF NOT EXISTS registrations_batch_name_idx ON public.registrations (batch_name);
