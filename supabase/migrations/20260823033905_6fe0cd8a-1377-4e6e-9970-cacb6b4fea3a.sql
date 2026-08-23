CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  dob date,
  gender text,
  marital_status text,

  specially_abled text,
  sa_types text[] NOT NULL DEFAULT '{}',
  sa_sub_types text[] NOT NULL DEFAULT '{}',
  sa_proof text,

  religion text,
  category text,
  caste text,
  nigama text,
  caste_cert_type text,
  rd_number text,
  caste_proof text,

  guardianship text,
  guardian_salutation text,
  guardian_first_name text,
  guardian_last_name text,

  cur_location text,
  cur_street1 text,
  cur_street2 text,
  cur_state text,
  cur_district text,
  cur_taluk text,
  cur_city text,
  cur_village text,
  cur_zip text,

  same_address text,
  per_location text,
  per_street1 text,
  per_street2 text,
  per_state text,
  per_district text,
  per_taluk text,
  per_city text,
  per_village text,
  per_zip text,

  education text,
  stream text,
  subject text,
  language_of_instruction text,
  other_language text,
  year_of_passing text,
  languages_known text[] NOT NULL DEFAULT '{}',
  past_skill_experience text,
  skill_experience_proof text,
  skill_sought text,
  training_duration text,
  apprenticeship text,

  currently_employed text,
  employed_from date,
  current_employer text,
  current_designation text,
  previously_employed text,
  work_experience text,
  last_employer text,
  last_designation text,
  last_salary text,
  last_employer_address text,
  employment_proof text,

  education_proof text,
  age_proof text,
  profile_image text,
  declaration_accepted boolean NOT NULL DEFAULT false,

  status text NOT NULL DEFAULT 'Pending',
  admin_notes text
);

CREATE INDEX registrations_created_at_idx ON public.registrations (created_at DESC);
CREATE INDEX registrations_status_idx ON public.registrations (status);

GRANT INSERT ON public.registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a registration" ON public.registrations
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can view registrations" ON public.registrations
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can update registrations" ON public.registrations
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete registrations" ON public.registrations
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER registrations_set_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();