-- Complete migration adding all new fields to registrations table
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS institution_name text,
ADD COLUMN IF NOT EXISTS center_location text,
ADD COLUMN IF NOT EXISTS caste_cert_issue_date date,
ADD COLUMN IF NOT EXISTS caste_cert_expiry_date date;
