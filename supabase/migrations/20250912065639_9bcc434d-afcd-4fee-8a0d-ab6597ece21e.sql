-- Fix security issue: Restrict cpv_merchant_status access to authenticated users only
-- Drop existing policies that allow public access
DROP POLICY IF EXISTS "CPV agents can view their assigned merchants" ON public.cpv_merchant_status;
DROP POLICY IF EXISTS "Form owners can view merchant status for their forms" ON public.cpv_merchant_status;
DROP POLICY IF EXISTS "Lead assigners can update assigned merchants" ON public.cpv_merchant_status;
DROP POLICY IF EXISTS "Lead assigners can view their assigned merchants" ON public.cpv_merchant_status;
DROP POLICY IF EXISTS "Super Admin can view all merchant status" ON public.cpv_merchant_status;
DROP POLICY IF EXISTS "Users can delete merchant status for their forms" ON public.cpv_merchant_status;
DROP POLICY IF EXISTS "Users can insert merchant status for their forms" ON public.cpv_merchant_status;

-- Create secure policies that only allow authenticated users with proper role-based access

-- Super Admin can view all merchant status (authenticated only)
CREATE POLICY "Super Admin can view all merchant status" 
ON public.cpv_merchant_status 
FOR SELECT 
TO authenticated
USING (is_super_admin());

-- Form owners can view merchant status for their forms (authenticated only)
CREATE POLICY "Form owners can view merchant status for their forms" 
ON public.cpv_merchant_status 
FOR SELECT 
TO authenticated
USING (user_owns_cpv_form(cpv_form_id, auth.uid()));

-- Lead assigners can view their assigned merchants (authenticated only)
CREATE POLICY "Lead assigners can view their assigned merchants" 
ON public.cpv_merchant_status 
FOR SELECT 
TO authenticated
USING (assigned_lead_assigner_id = auth.uid());

-- CPV agents can view their assigned merchants (authenticated only)
CREATE POLICY "CPV agents can view their assigned merchants" 
ON public.cpv_merchant_status 
FOR SELECT 
TO authenticated
USING (assigned_cpv_agent_id = auth.uid());

-- Form owners can insert merchant status for their forms (authenticated only)
CREATE POLICY "Form owners can insert merchant status for their forms" 
ON public.cpv_merchant_status 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM cpv_forms 
  WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
  AND cpv_forms.user_id = auth.uid()
));

-- Authorized users can update merchant status (authenticated only)
CREATE POLICY "Authorized users can update merchant status" 
ON public.cpv_merchant_status 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cpv_forms 
    WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
    AND cpv_forms.user_id = auth.uid()
  ) 
  OR assigned_lead_assigner_id = auth.uid() 
  OR assigned_cpv_agent_id = auth.uid()
);

-- Form owners can delete merchant status for their forms (authenticated only)
CREATE POLICY "Form owners can delete merchant status for their forms" 
ON public.cpv_merchant_status 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM cpv_forms 
  WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
  AND cpv_forms.user_id = auth.uid()
));