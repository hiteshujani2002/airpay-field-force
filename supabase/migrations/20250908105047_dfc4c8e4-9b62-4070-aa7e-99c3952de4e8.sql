-- Update RLS policy to allow lead assigners to see client admins who assigned forms to them
DROP POLICY IF EXISTS "view_users_by_role" ON public.user_roles;

CREATE POLICY "view_users_by_role" ON public.user_roles
FOR SELECT
USING (
  (get_current_user_role() = 'super_admin'::app_role) OR
  (
    (get_current_user_role() = 'client_admin'::app_role) AND (
      -- Client admins can see lead assigners in their company
      (role = 'lead_assigner'::app_role AND company = get_current_user_company()) OR
      -- Client admins can see CPV agents assigned to merchants from their forms
      (role = 'cpv_agent'::app_role AND user_id IN (
        SELECT DISTINCT cms.assigned_cpv_agent_id
        FROM cpv_merchant_status cms
        JOIN cpv_forms cf ON cf.id = cms.cpv_form_id
        WHERE cf.user_id = auth.uid()
        AND cms.assigned_cpv_agent_id IS NOT NULL
      ))
    )
  ) OR
  (
    (get_current_user_role() = 'lead_assigner'::app_role) AND (
      -- Lead assigners can see CPV agents they created
      (role = 'cpv_agent'::app_role AND created_by_user_id = auth.uid()) OR
      -- Lead assigners can see client admins who assigned forms to them
      (role = 'client_admin'::app_role AND user_id IN (
        SELECT DISTINCT cf.user_id
        FROM cpv_forms cf
        JOIN cpv_merchant_status cms ON cms.cpv_form_id = cf.id
        WHERE cms.assigned_lead_assigner_id = auth.uid()
      ))
    )
  ) OR
  (user_id = auth.uid())
);