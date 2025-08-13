-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Role-based user visibility" ON public.user_roles;
DROP POLICY IF EXISTS "Users can create based on role permissions" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete based on role permissions" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update based on role permissions" ON public.user_roles;

-- Create a security definer function to get current user's role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create a security definer function to get current user's company without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_company()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT company FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create simple, non-recursive RLS policies
CREATE POLICY "Users can view based on role hierarchy"
ON public.user_roles
FOR SELECT
USING (
  -- Super admin can see everyone
  public.get_current_user_role() = 'super_admin'
  OR
  -- Client admin can see lead assigners in their company
  (public.get_current_user_role() = 'client_admin' 
   AND role = 'lead_assigner' 
   AND company = public.get_current_user_company())
  OR
  -- Lead assigner can see CPV agents they created
  (public.get_current_user_role() = 'lead_assigner' 
   AND role = 'cpv_agent' 
   AND created_by_user_id = auth.uid())
  OR
  -- Users can see themselves
  user_id = auth.uid()
);

CREATE POLICY "Users can create based on permissions"
ON public.user_roles
FOR INSERT
WITH CHECK (
  -- Super admin can create anyone
  public.get_current_user_role() = 'super_admin'
  OR
  -- Client admin can create lead assigners
  (public.get_current_user_role() = 'client_admin' AND role = 'lead_assigner')
  OR
  -- Lead assigner can create CPV agents
  (public.get_current_user_role() = 'lead_assigner' AND role = 'cpv_agent')
);

CREATE POLICY "Users can update based on permissions"
ON public.user_roles
FOR UPDATE
USING (
  -- Super admin can update anyone
  public.get_current_user_role() = 'super_admin'
  OR
  -- Users can update themselves
  user_id = auth.uid()
  OR
  -- Client admin can update lead assigners in their company
  (public.get_current_user_role() = 'client_admin' 
   AND role = 'lead_assigner' 
   AND company = public.get_current_user_company())
  OR
  -- Lead assigner can update CPV agents they created
  (public.get_current_user_role() = 'lead_assigner' 
   AND role = 'cpv_agent' 
   AND created_by_user_id = auth.uid())
);

CREATE POLICY "Users can delete based on permissions"
ON public.user_roles
FOR DELETE
USING (
  -- Super admin can delete anyone
  public.get_current_user_role() = 'super_admin'
  OR
  -- Client admin can delete lead assigners in their company
  (public.get_current_user_role() = 'client_admin' 
   AND role = 'lead_assigner' 
   AND company = public.get_current_user_company())
  OR
  -- Lead assigner can delete CPV agents they created
  (public.get_current_user_role() = 'lead_assigner' 
   AND role = 'cpv_agent' 
   AND created_by_user_id = auth.uid())
);