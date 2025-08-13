-- Clean up duplicate user roles - keep only one role per user
-- First, let's identify the primary role for the current user
WITH ranked_roles AS (
  SELECT 
    id,
    user_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        CASE 
          WHEN role = 'super_admin' THEN 1
          WHEN role = 'client_admin' THEN 2
          WHEN role = 'lead_assigner' THEN 3
          WHEN role = 'cpv_agent' THEN 4
          ELSE 5
        END,
        created_at DESC
    ) as rn
  FROM public.user_roles
)
DELETE FROM public.user_roles
WHERE id IN (
  SELECT id FROM ranked_roles WHERE rn > 1
);

-- Update the get_users_by_role_access function to handle deletion properly
CREATE OR REPLACE FUNCTION public.get_users_by_role_access()
RETURNS TABLE(id uuid, user_id uuid, role app_role, username text, email text, contact_number text, company text, mapped_to_user_id uuid, created_by_user_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role app_role;
  current_user_company text;
BEGIN
  -- Get current user's role and company (take the highest priority role)
  SELECT ur.role, ur.company 
  INTO current_user_role, current_user_company
  FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid()
  ORDER BY 
    CASE 
      WHEN ur.role = 'super_admin' THEN 1
      WHEN ur.role = 'client_admin' THEN 2
      WHEN ur.role = 'lead_assigner' THEN 3
      WHEN ur.role = 'cpv_agent' THEN 4
      ELSE 5
    END
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

-- Update RLS policies to handle single role per user properly
DROP POLICY IF EXISTS "Users can delete based on role permissions" ON public.user_roles;

CREATE POLICY "Users can delete based on role permissions" 
ON public.user_roles 
FOR DELETE 
USING (
  -- Super Admin can delete anyone
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
  OR
  -- Client Admin can delete Lead Assigners from their company
  (
    role = 'lead_assigner' 
    AND company = (
      SELECT ur.company 
      FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'client_admin'
    )
  )
  OR
  -- Lead Assigner can delete CPV Agents they created
  (
    role = 'cpv_agent' 
    AND created_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'lead_assigner'
    )
  )
);