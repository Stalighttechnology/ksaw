-- ==============================================================================
-- MASTER SUPABASE SQL SCRIPT: Ensure all columns, indexes, RPCs, and RLS exist
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Add all new and existing columns safely to public.registrations
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS saf_number text,
  ADD COLUMN IF NOT EXISTS institution_name text,
  ADD COLUMN IF NOT EXISTS center_location text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS specially_abled text,
  ADD COLUMN IF NOT EXISTS sa_types text[],
  ADD COLUMN IF NOT EXISTS sa_sub_types text[],
  ADD COLUMN IF NOT EXISTS sa_proof text,
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS caste text,
  ADD COLUMN IF NOT EXISTS caste_sub_category text,
  ADD COLUMN IF NOT EXISTS nigama text,
  ADD COLUMN IF NOT EXISTS rd_number text,
  ADD COLUMN IF NOT EXISTS caste_cert_issue_date date,
  ADD COLUMN IF NOT EXISTS caste_cert_expiry_date date,
  ADD COLUMN IF NOT EXISTS caste_proof text,
  ADD COLUMN IF NOT EXISTS aadhaar_number text,
  ADD COLUMN IF NOT EXISTS aadhaar_proof text,
  ADD COLUMN IF NOT EXISTS guardianship text,
  ADD COLUMN IF NOT EXISTS guardian_salutation text,
  ADD COLUMN IF NOT EXISTS guardian_first_name text,
  ADD COLUMN IF NOT EXISTS guardian_last_name text,
  ADD COLUMN IF NOT EXISTS cur_location text,
  ADD COLUMN IF NOT EXISTS cur_street1 text,
  ADD COLUMN IF NOT EXISTS cur_street2 text,
  ADD COLUMN IF NOT EXISTS cur_state text,
  ADD COLUMN IF NOT EXISTS cur_district text,
  ADD COLUMN IF NOT EXISTS cur_taluk text,
  ADD COLUMN IF NOT EXISTS cur_city text,
  ADD COLUMN IF NOT EXISTS cur_village text,
  ADD COLUMN IF NOT EXISTS cur_zip text,
  ADD COLUMN IF NOT EXISTS same_address text,
  ADD COLUMN IF NOT EXISTS per_location text,
  ADD COLUMN IF NOT EXISTS per_street1 text,
  ADD COLUMN IF NOT EXISTS per_street2 text,
  ADD COLUMN IF NOT EXISTS per_state text,
  ADD COLUMN IF NOT EXISTS per_district text,
  ADD COLUMN IF NOT EXISTS per_taluk text,
  ADD COLUMN IF NOT EXISTS per_city text,
  ADD COLUMN IF NOT EXISTS per_village text,
  ADD COLUMN IF NOT EXISTS per_zip text,
  ADD COLUMN IF NOT EXISTS education text,
  ADD COLUMN IF NOT EXISTS stream text,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS language_of_instruction text,
  ADD COLUMN IF NOT EXISTS other_language text,
  ADD COLUMN IF NOT EXISTS year_of_passing text,
  ADD COLUMN IF NOT EXISTS languages_known text[],
  ADD COLUMN IF NOT EXISTS past_skill_experience text,
  ADD COLUMN IF NOT EXISTS skill_experience_proof text,
  ADD COLUMN IF NOT EXISTS skill_sought text,
  ADD COLUMN IF NOT EXISTS training_duration text,
  ADD COLUMN IF NOT EXISTS apprenticeship text,
  ADD COLUMN IF NOT EXISTS currently_employed text,
  ADD COLUMN IF NOT EXISTS employed_from date,
  ADD COLUMN IF NOT EXISTS current_employer text,
  ADD COLUMN IF NOT EXISTS current_designation text,
  ADD COLUMN IF NOT EXISTS previously_employed text,
  ADD COLUMN IF NOT EXISTS work_experience text,
  ADD COLUMN IF NOT EXISTS last_employer text,
  ADD COLUMN IF NOT EXISTS last_designation text,
  ADD COLUMN IF NOT EXISTS last_salary text,
  ADD COLUMN IF NOT EXISTS last_employer_address text,
  ADD COLUMN IF NOT EXISTS employment_proof text,
  ADD COLUMN IF NOT EXISTS education_proof text,
  ADD COLUMN IF NOT EXISTS age_proof text,
  ADD COLUMN IF NOT EXISTS profile_image text,
  ADD COLUMN IF NOT EXISTS declaration_accepted boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- 2. Create useful indexes for fast lookup and search
CREATE INDEX IF NOT EXISTS registrations_reference_number_idx ON public.registrations (reference_number);
CREATE INDEX IF NOT EXISTS registrations_saf_number_idx ON public.registrations (saf_number);
CREATE INDEX IF NOT EXISTS registrations_aadhaar_number_idx ON public.registrations (aadhaar_number);
CREATE INDEX IF NOT EXISTS registrations_status_idx ON public.registrations (status);

-- 3. Function to look up an applicant record by reference ID
CREATE OR REPLACE FUNCTION public.get_registration_by_ref(ref_id text)
RETURNS SETOF public.registrations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.registrations
  WHERE UPPER(TRIM(reference_number)) = UPPER(TRIM(ref_id))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_registration_by_ref(text) TO anon, authenticated;

-- 4. Function to update applicant record by reference ID
CREATE OR REPLACE FUNCTION public.update_registration_by_ref(
  ref_id text,
  payload jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.registrations
  SET
    institution_name = COALESCE(payload->>'institution_name', institution_name),
    center_location = COALESCE(payload->>'center_location', center_location),
    first_name = COALESCE(payload->>'first_name', first_name),
    last_name = COALESCE(payload->>'last_name', last_name),
    phone = COALESCE(payload->>'phone', phone),
    email = COALESCE(payload->>'email', email),
    dob = CASE WHEN payload->>'dob' IS NOT NULL AND payload->>'dob' != '' THEN (payload->>'dob')::date ELSE dob END,
    gender = COALESCE(payload->>'gender', gender),
    marital_status = COALESCE(payload->>'marital_status', marital_status),
    specially_abled = COALESCE(payload->>'specially_abled', specially_abled),
    sa_types = CASE WHEN payload->'sa_types' IS NOT NULL THEN ARRAY(SELECT jsonb_array_elements_text(payload->'sa_types')) ELSE sa_types END,
    sa_sub_types = CASE WHEN payload->'sa_sub_types' IS NOT NULL THEN ARRAY(SELECT jsonb_array_elements_text(payload->'sa_sub_types')) ELSE sa_sub_types END,
    sa_proof = payload->>'sa_proof',
    religion = COALESCE(payload->>'religion', religion),
    category = COALESCE(payload->>'category', category),
    caste = payload->>'caste',
    caste_sub_category = payload->>'caste_sub_category',
    nigama = payload->>'nigama',
    rd_number = payload->>'rd_number',
    caste_cert_issue_date = CASE WHEN payload->>'caste_cert_issue_date' IS NOT NULL AND payload->>'caste_cert_issue_date' != '' THEN (payload->>'caste_cert_issue_date')::date ELSE caste_cert_issue_date END,
    caste_cert_expiry_date = CASE WHEN payload->>'caste_cert_expiry_date' IS NOT NULL AND payload->>'caste_cert_expiry_date' != '' THEN (payload->>'caste_cert_expiry_date')::date ELSE caste_cert_expiry_date END,
    caste_proof = payload->>'caste_proof',
    aadhaar_number = COALESCE(payload->>'aadhaar_number', aadhaar_number),
    aadhaar_proof = COALESCE(payload->>'aadhaar_proof', aadhaar_proof),
    guardianship = COALESCE(payload->>'guardianship', guardianship),
    guardian_salutation = COALESCE(payload->>'guardian_salutation', guardian_salutation),
    guardian_first_name = COALESCE(payload->>'guardian_first_name', guardian_first_name),
    guardian_last_name = COALESCE(payload->>'guardian_last_name', guardian_last_name),
    cur_location = COALESCE(payload->>'cur_location', cur_location),
    cur_street1 = COALESCE(payload->>'cur_street1', cur_street1),
    cur_street2 = payload->>'cur_street2',
    cur_state = COALESCE(payload->>'cur_state', cur_state),
    cur_district = COALESCE(payload->>'cur_district', cur_district),
    cur_taluk = COALESCE(payload->>'cur_taluk', cur_taluk),
    cur_city = payload->>'cur_city',
    cur_village = payload->>'cur_village',
    cur_zip = COALESCE(payload->>'cur_zip', cur_zip),
    same_address = COALESCE(payload->>'same_address', same_address),
    per_location = COALESCE(payload->>'per_location', per_location),
    per_street1 = COALESCE(payload->>'per_street1', per_street1),
    per_street2 = payload->>'per_street2',
    per_state = COALESCE(payload->>'per_state', per_state),
    per_district = COALESCE(payload->>'per_district', per_district),
    per_taluk = COALESCE(payload->>'per_taluk', per_taluk),
    per_city = payload->>'per_city',
    per_village = payload->>'per_village',
    per_zip = COALESCE(payload->>'per_zip', per_zip),
    education = COALESCE(payload->>'education', education),
    stream = payload->>'stream',
    subject = payload->>'subject',
    language_of_instruction = COALESCE(payload->>'language_of_instruction', language_of_instruction),
    other_language = payload->>'other_language',
    year_of_passing = COALESCE(payload->>'year_of_passing', year_of_passing),
    languages_known = CASE WHEN payload->'languages_known' IS NOT NULL THEN ARRAY(SELECT jsonb_array_elements_text(payload->'languages_known')) ELSE languages_known END,
    past_skill_experience = COALESCE(payload->>'past_skill_experience', past_skill_experience),
    skill_experience_proof = payload->>'skill_experience_proof',
    skill_sought = COALESCE(payload->>'skill_sought', skill_sought),
    training_duration = COALESCE(payload->>'training_duration', training_duration),
    apprenticeship = COALESCE(payload->>'apprenticeship', apprenticeship),
    currently_employed = COALESCE(payload->>'currently_employed', currently_employed),
    employed_from = CASE WHEN payload->>'employed_from' IS NOT NULL AND payload->>'employed_from' != '' THEN (payload->>'employed_from')::date ELSE employed_from END,
    current_employer = payload->>'current_employer',
    current_designation = payload->>'current_designation',
    previously_employed = COALESCE(payload->>'previously_employed', previously_employed),
    work_experience = payload->>'work_experience',
    last_employer = payload->>'last_employer',
    last_designation = payload->>'last_designation',
    last_salary = payload->>'last_salary',
    last_employer_address = payload->>'last_employer_address',
    employment_proof = payload->>'employment_proof',
    education_proof = COALESCE(payload->>'education_proof', education_proof),
    age_proof = COALESCE(payload->>'age_proof', age_proof),
    profile_image = COALESCE(payload->>'profile_image', profile_image),
    declaration_accepted = true,
    updated_at = now()
  WHERE UPPER(TRIM(reference_number)) = UPPER(TRIM(ref_id));

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_registration_by_ref(text, jsonb) TO anon, authenticated;

-- 5. Function to link SAF number to registration
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

-- 6. Function to search registrations for link dropdown
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

-- 7. Function to check duplicate Aadhaar
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

-- 8. Refresh schema cache
NOTIFY pgrst, 'reload schema';
