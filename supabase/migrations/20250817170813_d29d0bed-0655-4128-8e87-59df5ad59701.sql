-- Add RLS policy for lead assigners to view their assigned merchant data
CREATE POLICY "Lead assigners can view assigned merchants" 
ON cpv_merchant_status 
FOR SELECT 
USING (
  -- Allow users to view merchant data for their forms
  EXISTS ( 
    SELECT 1
    FROM cpv_forms
    WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
    AND cpv_forms.user_id = auth.uid()
  )
  OR
  -- Allow lead assigners to view merchant data assigned to them
  assigned_lead_assigner_id = auth.uid()
);

-- Add RLS policy for lead assigners to update their assigned merchant data
CREATE POLICY "Lead assigners can update assigned merchants" 
ON cpv_merchant_status 
FOR UPDATE 
USING (
  -- Allow users to update merchant data for their forms
  EXISTS ( 
    SELECT 1
    FROM cpv_forms
    WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
    AND cpv_forms.user_id = auth.uid()
  )
  OR
  -- Allow lead assigners to update merchant data assigned to them
  assigned_lead_assigner_id = auth.uid()
);

-- Drop the old restrictive policies that only allowed form owners
DROP POLICY IF EXISTS "Users can view merchant status for their forms" ON cpv_merchant_status;
DROP POLICY IF EXISTS "Users can update merchant status for their forms" ON cpv_merchant_status;