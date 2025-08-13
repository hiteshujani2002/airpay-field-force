-- Fix existing data by updating null values with placeholder data for essential fields
UPDATE public.user_roles 
SET 
  username = 'system_user_' || SUBSTRING(id::text FROM 1 FOR 8),
  email = 'system_' || SUBSTRING(id::text FROM 1 FOR 8) || '@example.com',
  contact_number = '0000000000',
  company = 'System'
WHERE username IS NULL OR email IS NULL OR contact_number IS NULL OR company IS NULL;

-- Add NOT NULL constraints to essential fields
ALTER TABLE public.user_roles 
ALTER COLUMN username SET NOT NULL,
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN contact_number SET NOT NULL,
ALTER COLUMN company SET NOT NULL;

-- Update the create_user_invitation function to handle edge cases better
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_username text, 
  p_email text, 
  p_contact_number text, 
  p_role app_role, 
  p_company text DEFAULT NULL::text, 
  p_mapped_to_user_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate a unique user ID for the invitation
  new_user_id := gen_random_uuid();
  
  -- Insert the user role with invitation status
  INSERT INTO public.user_roles (
    user_id,
    role,
    username,
    email,
    contact_number,
    company,
    mapped_to_user_id,
    created_by_user_id
  ) VALUES (
    new_user_id,
    p_role,
    p_username,
    p_email,
    p_contact_number,
    COALESCE(p_company, 'Default Company'),
    p_mapped_to_user_id,
    auth.uid()
  );
  
  RETURN new_user_id;
END;
$$;