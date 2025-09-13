-- Update RLS policy to allow CPV agents to view lead assigners who assigned leads to them
DROP POLICY "view_users_by_role" ON public.user_roles;

CREATE POLICY "view_users_by_role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  -- Super admin can view all users
  (get_current_user_role() = 'super_admin'::app_role) OR 
  
  -- Client admin can view lead assigners in their company and cpv agents assigned to their forms
  ((get_current_user_role() = 'client_admin'::app_role) AND (
    ((role = 'lead_assigner'::app_role) AND (company = get_current_user_company())) OR 
    ((role = 'cpv_agent'::app_role) AND (user_id IN (
      SELECT DISTINCT cms.assigned_cpv_agent_id
      FROM (cpv_merchant_status cms JOIN cpv_forms cf ON ((cf.id = cms.cpv_form_id)))
      WHERE ((cf.user_id = auth.uid()) AND (cms.assigned_cpv_agent_id IS NOT NULL))
    )))
  )) OR 
  
  -- Lead assigner can view cpv agents they created and client admins they report to
  ((get_current_user_role() = 'lead_assigner'::app_role) AND (
    ((role = 'cpv_agent'::app_role) AND (created_by_user_id = auth.uid())) OR 
    ((role = 'client_admin'::app_role) AND (user_id IN (
      SELECT DISTINCT cf.user_id
      FROM (cpv_forms cf JOIN cpv_merchant_status cms ON ((cms.cpv_form_id = cf.id)))
      WHERE (cms.assigned_lead_assigner_id = auth.uid())
    )))
  )) OR 
  
  -- CPV agents can view lead assigners who assigned leads to them
  ((get_current_user_role() = 'cpv_agent'::app_role) AND (
    (role = 'lead_assigner'::app_role) AND (user_id IN (
      SELECT DISTINCT cms.assigned_lead_assigner_id
      FROM cpv_merchant_status cms
      WHERE (cms.assigned_cpv_agent_id = auth.uid() AND cms.assigned_lead_assigner_id IS NOT NULL)
    ))
  )) OR 
  
  -- Users can always view their own profile
  (user_id = auth.uid())
);