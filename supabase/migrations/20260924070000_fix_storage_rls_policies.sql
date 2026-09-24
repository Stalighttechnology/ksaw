-- Fix storage RLS: allow authenticated admins to upload/update/read/delete
-- objects in the "registrations" storage bucket (used for colleges_manifest.json and related files).
-- Without these policies, any supabase.storage.upload() call returns a 403 "new row violates
-- row-level security policy" error even when the user is authenticated.

-- Allow authenticated users to INSERT (upload new) objects into the bucket
CREATE POLICY "Authenticated users can upload to registrations bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'registrations');

-- Allow authenticated users to UPDATE (upsert / replace) objects in the bucket
CREATE POLICY "Authenticated users can update registrations bucket objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'registrations')
WITH CHECK (bucket_id = 'registrations');

-- Allow authenticated users to SELECT (read / list) objects in the bucket
CREATE POLICY "Authenticated users can read registrations bucket objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'registrations');

-- Allow authenticated users to DELETE objects in the bucket
CREATE POLICY "Authenticated users can delete registrations bucket objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'registrations');

-- Also allow anonymous public reads for the colleges_manifest.json
-- (needed for the public CDN fetch path in fetchCustomColleges)
CREATE POLICY "Public can read colleges manifest"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'registrations'
  AND (
    name = 'colleges_manifest.json'
    OR name LIKE 'colleges_%'
    OR name LIKE 'manifests/%'
  )
);
