-- Add SPOC fields to entities table for better data tracking
ALTER TABLE public.entities 
ADD COLUMN spoc_email TEXT,
ADD COLUMN spoc_contact TEXT,
ADD COLUMN spoc_username TEXT;