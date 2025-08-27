-- Fix infinite recursion in RLS policies by creating security definer functions

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "CPV agents can view assigned forms" ON public.cpv_forms;

-- Create security definer function to check if user is assigned to a CPV form as agent
CREATE OR REPLACE FUNCTION public.user_is_assigned_cpv_agent(form_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cpv_merchant_status
    WHERE cpv_form_id = form_id
      AND assigned_cpv_agent_id = user_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "CPV agents can view assigned forms"
ON public.cpv_forms
FOR SELECT
USING (public.user_is_assigned_cpv_agent(id, auth.uid()));

-- Also create a function to check if user owns a CPV form to avoid future recursion
CREATE OR REPLACE FUNCTION public.user_owns_cpv_form(form_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cpv_forms
    WHERE id = form_id
      AND user_id = user_id
  )
$$;

-- Update the merchant status policy to use the security definer function
DROP POLICY IF EXISTS "Form owners can view merchant status for their forms" ON public.cpv_merchant_status;
CREATE POLICY "Form owners can view merchant status for their forms"
ON public.cpv_merchant_status
FOR SELECT
USING (public.user_owns_cpv_form(cpv_form_id, auth.uid()));