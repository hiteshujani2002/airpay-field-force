-- Drop the problematic policies first
DROP POLICY IF EXISTS "Super Admin can view all CPV forms" ON public.cpv_forms;
DROP POLICY IF EXISTS "Super Admin can view all merchant status" ON public.cpv_merchant_status;

-- Create a security definer function to check if current user is super admin
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
$$;

-- Now create the policies using the security definer function
CREATE POLICY "Super Admin can view all CPV forms" 
ON public.cpv_forms 
FOR SELECT 
USING (public.is_super_admin());

CREATE POLICY "Super Admin can view all merchant status" 
ON public.cpv_merchant_status 
FOR SELECT 
USING (public.is_super_admin());