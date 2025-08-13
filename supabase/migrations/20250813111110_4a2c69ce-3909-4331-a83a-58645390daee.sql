-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_username text,
  p_email text,
  p_contact_number text,
  p_role app_role,
  p_company text DEFAULT NULL,
  p_mapped_to_user_id uuid DEFAULT NULL
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
    p_company,
    p_mapped_to_user_id,
    auth.uid()
  );
  
  RETURN new_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_users_by_role_access()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role app_role,
  username text,
  email text,
  contact_number text,
  company text,
  mapped_to_user_id uuid,
  created_by_user_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role app_role;
  current_user_company text;
BEGIN
  -- Get current user's role and company
  SELECT ur.role, ur.company 
  INTO current_user_role, current_user_company
  FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  -- Return users based on role-based access rules
  IF current_user_role = 'super_admin' THEN
    -- Super Admin can see all users
    RETURN QUERY
    SELECT ur.id, ur.user_id, ur.role, ur.username, ur.email, 
           ur.contact_number, ur.company, ur.mapped_to_user_id, 
           ur.created_by_user_id, ur.created_at, ur.updated_at
    FROM public.user_roles ur
    ORDER BY ur.created_at DESC;
    
  ELSIF current_user_role = 'client_admin' THEN
    -- Client Admin can see Lead Assigners mapped to their company
    RETURN QUERY
    SELECT ur.id, ur.user_id, ur.role, ur.username, ur.email, 
           ur.contact_number, ur.company, ur.mapped_to_user_id, 
           ur.created_by_user_id, ur.created_at, ur.updated_at
    FROM public.user_roles ur
    WHERE ur.role = 'lead_assigner' AND ur.company = current_user_company
    ORDER BY ur.created_at DESC;
    
  ELSIF current_user_role = 'lead_assigner' THEN
    -- Lead Assigner can see CPV Agents they created
    RETURN QUERY
    SELECT ur.id, ur.user_id, ur.role, ur.username, ur.email, 
           ur.contact_number, ur.company, ur.mapped_to_user_id, 
           ur.created_by_user_id, ur.created_at, ur.updated_at
    FROM public.user_roles ur
    WHERE ur.role = 'cpv_agent' AND ur.created_by_user_id = auth.uid()
    ORDER BY ur.created_at DESC;
    
  ELSE
    -- CPV Agent and others can't see any users
    RETURN;
  END IF;
END;
$$;