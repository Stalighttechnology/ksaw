-- Allow authenticated admins/staff to update Amrutha Munnade Assessment records
DROP POLICY IF EXISTS "Admins can update amrutha munnade assessments" ON public.amrutha_munnade_assessment;
CREATE POLICY "Admins can update amrutha munnade assessments"
  ON public.amrutha_munnade_assessment
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR auth.role() = 'authenticated'
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR auth.role() = 'authenticated'
  );

