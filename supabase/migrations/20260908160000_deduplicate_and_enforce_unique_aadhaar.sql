-- ==============================================================================
-- MIGRATION: Deduplicate Candidates & Enforce UNIQUE Constraint on Aadhaar Number
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

BEGIN;

-- 1. Propagate any 'Approved' status from duplicates to the primary record
UPDATE public.registrations
SET status = 'Approved', updated_at = now()
WHERE id IN (
  '8e396c39-bc2e-4027-9d4e-37298744530d', -- Geetha M J (KSAW 001)
  '88afefa9-cdab-4880-92fe-9ba73848817d', -- Varsha R (KSAW 509)
  'd0146f6e-14f8-4771-bdb0-1f73bef4a218'  -- Yashaswini G P (KSAW 002)
);

-- 2. Delete the 55 redundant duplicate records (Batches from Sep 7, 2026)
DELETE FROM public.registrations
WHERE id IN (
  'ed329d5f-add6-48cc-a617-e659471ee269',
  '51edac25-eb69-4c35-973d-934ac7b713dc',
  '8689fe3a-b816-40b4-a110-c1ee13f8cffd',
  'b7333a20-47a8-451c-9b34-ed88216a6e4b',
  'c5af0308-7618-430b-9f64-eee89a29d5dc',
  '315b6117-1eaf-45d1-96be-48b8d1ab5eba',
  '6277cd74-d0c0-4883-a1c2-851ec80b2ff4',
  'f7c36ce8-13b6-4fd6-88d8-db72b7a35aa9',
  'e8ec1609-1855-4003-84da-32d0c27dbb7a',
  '5e13057c-ab5f-4a6a-9055-244e1ba251ab',
  '85f09522-7454-426a-a3e8-ca096e6803c4',
  'b9ff88bf-8e63-44da-83bd-ad643ab65ccb',
  '368b18c4-0458-4585-af9f-f6ca84e872c5',
  'bd1cace8-fd25-4876-ae7b-80a6956acfff',
  '2ae90394-b38b-4b1f-9a94-c2139a1352de',
  '1ea91245-4f90-4e17-8704-b9eed9fbb227',
  '274e6b52-7df7-4d27-a7b3-b5bf8ba161f6',
  '4e2b46ba-2ecc-406b-be21-0c25ac396aee',
  'e4f8e2ae-eeb2-4bea-b107-868751c81e3c',
  'da2be9ae-e26e-49da-be32-0e2da5e44b0f',
  '61e1ab1d-7258-4fd1-a4be-e12bf542ea77',
  '7cc04bf2-aa18-42f9-bcbf-b1c59f989737',
  'a3f712a9-d7ea-4cfb-881a-b6af1ad67dc8',
  '3a2329b8-b49f-4852-8da3-a2eede76416a',
  '1fddf4c7-8765-4ed9-bc87-4ba0c28fbd82',
  'fedad3eb-1df5-4b7b-938f-33f111ab4738',
  '878a0f59-5ea6-425b-9991-760d54cce14a',
  '48294eed-16ba-4ec1-b61a-c6c474353eae',
  'f04000ec-ee85-44a2-b247-67568bc328f5',
  '161c22bb-2ae2-43e1-aa83-a0888078e199',
  '053e67d7-189f-485f-8b30-fa9abd4c9dc6',
  '4bf5a630-dbc7-4df4-916f-7ad622e91344',
  '69a11220-ab8d-43b3-80e9-b3200c663564',
  'd2fa0b01-5b2b-40b9-8f28-0826347e9e7e',
  '2915789f-d6f1-4bcf-85b3-57584b6ab12f',
  'e895eaf3-4e08-41fd-af86-ca8f79b3cf69',
  '59315bde-e1fe-460b-873f-910615ea1f2c',
  'f04d9dc8-abb7-47f8-a528-233ae670b3fc',
  '13338e04-c1c4-43c1-812e-687199b2c519',
  '8c66a0e9-5928-4b83-9986-1a4c2e1a2950',
  'cc1f8213-bf4e-498e-89f8-8e7429bffd6c',
  '0d763074-3afa-418e-91c3-5ca7e4f2d49b',
  'ede9a1f3-eeee-4cec-98f6-db60d7d09ade',
  '2156df19-621a-40eb-9d13-e6a3270fb533',
  'e0547867-1207-43aa-935b-6cbfa2cd6ce9',
  'f4f6bc2b-c7db-4e55-b7d0-bceb0dd8f278',
  '32c24ee8-bbcc-4ab5-ae62-5b535abe3bbd',
  '35e27e10-d997-4a1d-bff5-29a11f229c16',
  '08d3a2a5-7764-4a74-bd76-26ae84e56b5e',
  'a5ca7c7e-278f-4463-b90f-fbd4264b1d2d',
  'a24748ef-6495-4800-add5-083c9d4f7ccf',
  '44034327-eee7-4bd3-b33e-1260fcbc03f9',
  'da598098-80b1-4a68-8210-6464a349635a',
  '021385d5-6171-4439-a4f1-c2fea8e97c0e',
  'dd6a7cbb-87f4-43d1-a244-61c025c2ec82'
);

-- 3. Standardize and clean all existing Aadhaar numbers (strip spaces/non-digits)
UPDATE public.registrations
SET aadhaar_number = regexp_replace(TRIM(aadhaar_number), '\D', '', 'g')
WHERE aadhaar_number IS NOT NULL;

-- 4. Drop any existing non-unique index if needed
DROP INDEX IF EXISTS registrations_aadhaar_number_idx;

-- 5. Add UNIQUE constraint to guarantee duplicate Aadhaar can never be inserted again
ALTER TABLE public.registrations
DROP CONSTRAINT IF EXISTS registrations_aadhaar_number_unique;

ALTER TABLE public.registrations
ADD CONSTRAINT registrations_aadhaar_number_unique UNIQUE (aadhaar_number);

-- 6. Trigger to automatically sanitize Aadhaar before any future insert/update
CREATE OR REPLACE FUNCTION public.clean_aadhaar_before_save()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.aadhaar_number IS NOT NULL THEN
    NEW.aadhaar_number := regexp_replace(TRIM(NEW.aadhaar_number), '\D', '', 'g');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clean_aadhaar ON public.registrations;
CREATE TRIGGER trg_clean_aadhaar
BEFORE INSERT OR UPDATE OF aadhaar_number ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.clean_aadhaar_before_save();

-- 7. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;
