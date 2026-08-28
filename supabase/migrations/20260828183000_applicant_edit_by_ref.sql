-- Allow applicants to query and update their existing registration by reference_number
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

-- Allow updating registration when matching reference_number
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
    dob = CASE WHEN payload->>'dob' IS NOT NULL THEN (payload->>'dob')::date ELSE dob END,
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
    caste_cert_issue_date = CASE WHEN payload->>'caste_cert_issue_date' IS NOT NULL THEN (payload->>'caste_cert_issue_date')::date ELSE caste_cert_issue_date END,
    caste_cert_expiry_date = CASE WHEN payload->>'caste_cert_expiry_date' IS NOT NULL THEN (payload->>'caste_cert_expiry_date')::date ELSE caste_cert_expiry_date END,
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
    employed_from = CASE WHEN payload->>'employed_from' IS NOT NULL THEN (payload->>'employed_from')::date ELSE employedFrom END,
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
