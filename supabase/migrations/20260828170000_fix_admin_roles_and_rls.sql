-- 1. Ensure all authenticated users or specific users have the admin role in user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Update the role trigger so any newly created user automatically gets the admin role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Ensure RLS policies allow authenticated users with admin/staff roles to view and manage registrations
DROP POLICY IF EXISTS "Admins can view registrations" ON public.registrations;
CREATE POLICY "Admins can view registrations" ON public.registrations
FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;
CREATE POLICY "Admins can update registrations" ON public.registrations
FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated'
) WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
CREATE POLICY "Admins can delete registrations" ON public.registrations
FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated'
);
