-- Add RLS policy to allow Super Admin to view all CPV forms
CREATE POLICY "Super Admin can view all CPV forms" 
ON public.cpv_forms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Add RLS policy to allow Super Admin to view all merchant status
CREATE POLICY "Super Admin can view all merchant status" 
ON public.cpv_merchant_status 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);