-- Add RLS policy to allow Lead Assigners to view CPV forms through merchant assignments
CREATE POLICY "Lead assigners can view forms through merchant assignments" 
ON cpv_forms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM cpv_merchant_status 
    WHERE cpv_merchant_status.cpv_form_id = cpv_forms.id 
    AND cpv_merchant_status.assigned_lead_assigner_id = auth.uid()
  )
);

-- Also ensure Lead Assigners can update CPV forms they are assigned to
CREATE POLICY "Lead assigners can update assigned forms through merchant assignments" 
ON cpv_forms 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM cpv_merchant_status 
    WHERE cpv_merchant_status.cpv_form_id = cpv_forms.id 
    AND cpv_merchant_status.assigned_lead_assigner_id = auth.uid()
  )
);