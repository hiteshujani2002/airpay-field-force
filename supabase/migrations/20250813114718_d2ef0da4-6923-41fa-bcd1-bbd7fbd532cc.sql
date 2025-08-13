-- Remove the foreign key constraint that's preventing user invitations
-- The user_id in user_roles should NOT reference auth.users for invitation system
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Update the create_user_invitation function to be more robust
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_username text, 
  p_email text, 
  p_contact_number text, 
  p_role app_role, 
  p_company text DEFAULT 'Default Company', 
  p_mapped_to_user_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_user_id uuid;
  current_user_role app_role;
BEGIN
  -- Get current user's role for validation
  SELECT role INTO current_user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Validate permissions
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'User role not found';
  END IF;
  
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
    p_company,
    p_mapped_to_user_id,
    auth.uid()
  );
  
  RETURN new_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user invitation: %', SQLERRM;
END;
$$;