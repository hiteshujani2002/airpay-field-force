-- Update the CPV form to be properly assigned to the Lead Assigner
-- This form has merchant data assigned to the Lead Assigner but the form itself isn't marked as assigned
UPDATE cpv_forms 
SET assigned_lead_assigner_id = 'fa51ad93-4d3e-4612-93f1-9cf11fed3490'
WHERE id = '7149080c-cf3d-411c-ad31-b9b5f543ef4a'
AND EXISTS (
  SELECT 1 FROM cpv_merchant_status 
  WHERE cpv_form_id = '7149080c-cf3d-411c-ad31-b9b5f543ef4a' 
  AND assigned_lead_assigner_id = 'fa51ad93-4d3e-4612-93f1-9cf11fed3490'
);