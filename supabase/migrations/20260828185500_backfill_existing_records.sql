-- ==============================================================================
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO FIX 'N/A' ON OLD RECORDS
-- ==============================================================================

-- 1. Ensure all columns exist
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS saf_number text,
  ADD COLUMN IF NOT EXISTS institution_name text,
  ADD COLUMN IF NOT EXISTS center_location text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- 2. Backfill existing records that have NULL reference_number
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM public.registrations
  WHERE reference_number IS NULL OR reference_number = ''
)
UPDATE public.registrations r
SET reference_number = 'KSAW ' || LPAD(numbered.row_num::text, 3, '0')
FROM numbered
WHERE r.id = numbered.id;

-- 3. Backfill admin_notes to empty or default if null
UPDATE public.registrations
SET admin_notes = ''
WHERE admin_notes IS NULL;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
