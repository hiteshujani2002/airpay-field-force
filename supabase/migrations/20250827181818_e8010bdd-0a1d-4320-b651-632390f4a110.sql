-- Add policy to allow CPV form owners to view merchant data for their forms
CREATE POLICY "Form owners can view merchant status for their forms" 
ON public.cpv_merchant_status 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM cpv_forms 
  WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
  AND cpv_forms.user_id = auth.uid()
));