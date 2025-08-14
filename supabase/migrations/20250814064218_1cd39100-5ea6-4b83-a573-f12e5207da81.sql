-- First, get the exact names of existing policies
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    -- Drop all existing policies on user_roles table
    FOR policy_rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', policy_rec.policyname);
    END LOOP;
END $$;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_company()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT company FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create new simplified RLS policies
CREATE POLICY "view_users_by_role"
ON public.user_roles
FOR SELECT
USING (
  public.get_current_user_role() = 'super_admin'
  OR
  (public.get_current_user_role() = 'client_admin' 
   AND role = 'lead_assigner' 
   AND company = public.get_current_user_company())
  OR
  (public.get_current_user_role() = 'lead_assigner' 
   AND role = 'cpv_agent' 
   AND created_by_user_id = auth.uid())
  OR
  user_id = auth.uid()
);

CREATE POLICY "create_users_by_role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  public.get_current_user_role() = 'super_admin'
  OR
  (public.get_current_user_role() = 'client_admin' AND role = 'lead_assigner')
  OR
  (public.get_current_user_role() = 'lead_assigner' AND role = 'cpv_agent')
);

CREATE POLICY "update_users_by_role"
ON public.user_roles
FOR UPDATE
USING (
  public.get_current_user_role() = 'super_admin'
  OR
  user_id = auth.uid()
  OR
  (public.get_current_user_role() = 'client_admin' 
   AND role = 'lead_assigner' 
   AND company = public.get_current_user_company())
  OR
  (public.get_current_user_role() = 'lead_assigner' 
   AND role = 'cpv_agent' 
   AND created_by_user_id = auth.uid())
);

CREATE POLICY "delete_users_by_role"
ON public.user_roles
FOR DELETE
USING (
  public.get_current_user_role() = 'super_admin'
  OR
  (public.get_current_user_role() = 'client_admin' 
   AND role = 'lead_assigner' 
   AND company = public.get_current_user_company())
  OR
  (public.get_current_user_role() = 'lead_assigner' 
   AND role = 'cpv_agent' 
   AND created_by_user_id = auth.uid())
);