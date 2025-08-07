-- Create enums for entity types and related data
CREATE TYPE public.entity_type AS ENUM ('company', 'agency');
CREATE TYPE public.company_type AS ENUM ('private_limited', 'public_limited', 'partnership', 'sole_proprietorship', 'llp');
CREATE TYPE public.office_ownership AS ENUM ('owned', 'rented', 'shared');

-- Create entities table for Entity Onboarding
CREATE TABLE public.entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type public.entity_type NOT NULL,
    
    -- Company specific fields
    company_name TEXT,
    company_type public.company_type,
    cin TEXT,
    gst_number TEXT,
    pan TEXT,
    udyam_number TEXT,
    
    -- Agency specific fields
    agency_name TEXT,
    parent_company TEXT,
    
    -- Common address fields
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    pincode TEXT,
    
    -- Office details
    office_ownership public.office_ownership,
    
    -- Uploaded documents (JSON array of file info)
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on entities
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for entities
CREATE POLICY "Users can view their own entities" 
ON public.entities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entities" 
ON public.entities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entities" 
ON public.entities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entities" 
ON public.entities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create enums for CPV form fields
CREATE TYPE public.field_data_type AS ENUM ('text', 'number', 'email', 'phone', 'date', 'dropdown', 'checkbox', 'radio');
CREATE TYPE public.field_type AS ENUM ('text', 'image');

-- Create cpv_forms table
CREATE TABLE public.cpv_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    initiative TEXT NOT NULL,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on cpv_forms
ALTER TABLE public.cpv_forms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cpv_forms
CREATE POLICY "Users can view their own CPV forms" 
ON public.cpv_forms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CPV forms" 
ON public.cpv_forms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CPV forms" 
ON public.cpv_forms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CPV forms" 
ON public.cpv_forms 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_entities_updated_at
    BEFORE UPDATE ON public.entities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cpv_forms_updated_at
    BEFORE UPDATE ON public.cpv_forms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time for both tables
ALTER TABLE public.entities REPLICA IDENTITY FULL;
ALTER TABLE public.cpv_forms REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.entities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cpv_forms;