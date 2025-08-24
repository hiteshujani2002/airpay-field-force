-- Add verification_pdf_url column to cpv_merchant_status table
ALTER TABLE public.cpv_merchant_status 
ADD COLUMN verification_pdf_url TEXT;