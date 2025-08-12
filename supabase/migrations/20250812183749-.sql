-- Create CPV Merchant Status table to track merchant verification activities
CREATE TABLE public.cpv_merchant_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpv_form_id UUID NOT NULL,
  merchant_name TEXT NOT NULL,
  merchant_phone TEXT NOT NULL,
  merchant_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  cpv_agent TEXT,
  assigned_lead_assigner_id UUID,
  uploaded_by_user_id UUID NOT NULL,
  assigned_on TIMESTAMP WITH TIME ZONE,
  uploaded_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verification_status TEXT DEFAULT 'pending',
  verification_file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cpv_merchant_status ENABLE ROW LEVEL SECURITY;

-- Create policies for cpv_merchant_status
CREATE POLICY "Users can view merchant status for their forms" 
ON public.cpv_merchant_status 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cpv_forms 
    WHERE cpv_forms.id = cpv_merchant_status.cpv_form_id 
    AND cpv_forms.user_id = auth.uid()
  )
);

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

CREATE POLICY "Users can update merchant status for their forms" 
ON public.cpv_merchant_status 
FOR UPDATE 
USING (
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

-- Create index for better performance
CREATE INDEX idx_cpv_merchant_status_form_id ON public.cpv_merchant_status(cpv_form_id);
CREATE INDEX idx_cpv_merchant_status_assigned_lead ON public.cpv_merchant_status(assigned_lead_assigner_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cpv_merchant_status_updated_at
BEFORE UPDATE ON public.cpv_merchant_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();