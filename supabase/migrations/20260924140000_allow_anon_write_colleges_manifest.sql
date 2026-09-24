-- Allow anonymous users to write the colleges manifest file only.
-- The Supabase client on localhost uses brokeredPreviewStorage which falls back
-- to localStorage for the auth session. In some cases the session is not being
-- forwarded correctly with storage upload requests (the auth header is stripped
-- for new-format sb_publishable_ API keys when no user JWT is present).
-- Since the college list is public information and not sensitive, we allow
-- the anon role to upsert the single manifest file. Applicant uploads (all
-- other files in the bucket) still require authentication.

-- Allow anon to INSERT the colleges manifest (first-time create)
CREATE POLICY "Anon can insert colleges manifest"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'registrations'
  AND name = 'colleges_manifest.json'
);

-- Allow anon to UPDATE the colleges manifest (upsert existing)
CREATE POLICY "Anon can update colleges manifest"
ON storage.objects
FOR UPDATE
TO anon
USING (
  bucket_id = 'registrations'
  AND name = 'colleges_manifest.json'
)
WITH CHECK (
  bucket_id = 'registrations'
  AND name = 'colleges_manifest.json'
);
