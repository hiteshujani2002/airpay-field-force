-- Add field to store completed form data in cpv_merchant_status table
ALTER TABLE cpv_merchant_status 
ADD COLUMN completed_form_data JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN cpv_merchant_status.completed_form_data IS 'Stores the actual data filled by CPV agent when completing the form';