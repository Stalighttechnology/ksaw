REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Create storage bucket for registrations if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('registrations', 'registrations', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for the registrations bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'registrations');

CREATE POLICY "Public Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'registrations');