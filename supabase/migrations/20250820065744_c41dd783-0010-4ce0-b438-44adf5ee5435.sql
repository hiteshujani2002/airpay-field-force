-- Clean up orphaned records before creating foreign key
DELETE FROM public.cpv_merchant_status 
WHERE cpv_form_id NOT IN (
  SELECT id FROM public.cpv_forms
);

-- Now add foreign key relationship between cpv_merchant_status and cpv_forms
ALTER TABLE public.cpv_merchant_status 
ADD CONSTRAINT cpv_merchant_status_cpv_form_id_fkey 
FOREIGN KEY (cpv_form_id) REFERENCES public.cpv_forms(id) ON DELETE CASCADE;

-- Create index for better performance on the foreign key
CREATE INDEX IF NOT EXISTS idx_cpv_merchant_status_cpv_form_id 
ON public.cpv_merchant_status(cpv_form_id);

-- Update RLS policies for cpv_merchant_status to ensure proper data access
-- First drop existing policies
DROP POLICY IF EXISTS "Lead assigners can view assigned merchants" ON public.cpv_merchant_status;
DROP POLICY IF EXISTS "Lead assigners can update assigned merchants" ON public.cpv_merchant_status;
DROP POLICY IF EXISTS "Users can insert merchant status for their forms" ON public.cpv_merchant_status;
DROP POLICY IF EXISTS "Users can delete merchant status for their forms" ON public.cpv_merchant_status;

-- Create improved policies for proper data access
CREATE POLICY "Users can insert merchant status for their forms" 
ON public.cpv_merchant_status 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cpv_forms 
    WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
    AND cpv_forms.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete merchant status for their forms" 
ON public.cpv_merchant_status 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.cpv_forms 
    WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
    AND cpv_forms.user_id = auth.uid()
  )
);

-- Updated policy for lead assigners to view assigned merchants
CREATE POLICY "Lead assigners can view assigned merchants" 
ON public.cpv_merchant_status 
FOR SELECT 
USING (
  -- Form owners can see all merchant data for their forms
  EXISTS (
    SELECT 1 FROM public.cpv_forms 
    WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
    AND cpv_forms.user_id = auth.uid()
  )
  OR 
  -- Lead assigners can see merchants assigned to them
  assigned_lead_assigner_id = auth.uid()
  OR
  -- CPV agents can see merchants assigned to them
  assigned_cpv_agent_id = auth.uid()
);

-- Updated policy for lead assigners to update assigned merchants
CREATE POLICY "Lead assigners can update assigned merchants" 
ON public.cpv_merchant_status 
FOR UPDATE 
USING (
  -- Form owners can update all merchant data for their forms
  EXISTS (
    SELECT 1 FROM public.cpv_forms 
    WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
    AND cpv_forms.user_id = auth.uid()
  )
  OR 
  -- Lead assigners can update merchants assigned to them
  assigned_lead_assigner_id = auth.uid()
  OR
  -- CPV agents can update merchants assigned to them
  assigned_cpv_agent_id = auth.uid()
);