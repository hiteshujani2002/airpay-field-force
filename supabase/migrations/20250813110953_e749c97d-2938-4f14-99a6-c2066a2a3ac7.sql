-- First, let's update the user_roles table structure to support mapping relationships
ALTER TABLE public.user_roles 
ADD COLUMN company text,
ADD COLUMN mapped_to_user_id uuid REFERENCES auth.users(id),
ADD COLUMN created_by_user_id uuid REFERENCES auth.users(id),
ADD COLUMN username text,
ADD COLUMN email text,
ADD COLUMN contact_number text;

-- Add the Super Admin user entry
-- Note: We'll need to create an auth user first, then add the role
-- For now, let's create a placeholder structure

-- Enable real-time functionality for user_roles table
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;

-- Create a function to handle user invitations
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

-- Create a function to get users based on role-based visibility
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

-- Update RLS policies for the new structure
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

-- New RLS policies for role-based access
CREATE POLICY "Role-based user visibility" 
ON public.user_roles 
FOR SELECT 
USING (
  -- Super Admin can see all
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
  OR
  -- Client Admin can see Lead Assigners in their company
  (role = 'lead_assigner' AND company = (SELECT company FROM public.user_roles WHERE user_id = auth.uid() AND role = 'client_admin'))
  OR
  -- Lead Assigner can see CPV Agents they created
  (role = 'cpv_agent' AND created_by_user_id = auth.uid())
  OR
  -- Users can see their own record
  (user_id = auth.uid())
);

CREATE POLICY "Users can create based on role permissions" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  -- Super Admin can create anyone
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
  OR
  -- Client Admin can create other Client Admins in same company
  (role = 'client_admin' AND 
   company = (SELECT company FROM public.user_roles WHERE user_id = auth.uid() AND role = 'client_admin'))
  OR
  -- Lead Assigner can create CPV Agents
  (role = 'cpv_agent' AND 
   EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'lead_assigner'))
);

CREATE POLICY "Users can update based on role permissions" 
ON public.user_roles 
FOR UPDATE 
USING (
  -- Super Admin can update anyone
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
  OR
  -- Users can update their own record
  (user_id = auth.uid())
  OR
  -- Client Admin can update Lead Assigners in their company
  (role = 'lead_assigner' AND 
   company = (SELECT company FROM public.user_roles WHERE user_id = auth.uid() AND role = 'client_admin'))
  OR
  -- Lead Assigner can update CPV Agents they created
  (role = 'cpv_agent' AND created_by_user_id = auth.uid())
);

CREATE POLICY "Users can delete based on role permissions" 
ON public.user_roles 
FOR DELETE 
USING (
  -- Super Admin can delete anyone
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
  OR
  -- Client Admin can delete Lead Assigners in their company
  (role = 'lead_assigner' AND 
   company = (SELECT company FROM public.user_roles WHERE user_id = auth.uid() AND role = 'client_admin'))
  OR
  -- Lead Assigner can delete CPV Agents they created
  (role = 'cpv_agent' AND created_by_user_id = auth.uid())
);