-- Fix infinite recursion in RLS policies by removing circular dependencies

-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Lead assigners can view assigned merchants" ON cpv_merchant_status;
DROP POLICY IF EXISTS "Lead assigners can view forms through merchant assignments" ON cpv_forms;
DROP POLICY IF EXISTS "Lead assigners can update assigned forms through merchant assig" ON cpv_forms;

-- Create new non-circular policies for cpv_merchant_status
CREATE POLICY "Lead assigners can view their assigned merchants"
ON cpv_merchant_status
FOR SELECT
USING (assigned_lead_assigner_id = auth.uid());

CREATE POLICY "CPV agents can view their assigned merchants"  
ON cpv_merchant_status
FOR SELECT
USING (assigned_cpv_agent_id = auth.uid());

-- Create new non-circular policies for cpv_forms  
CREATE POLICY "Lead assigners can view their assigned forms"
ON cpv_forms
FOR SELECT  
USING (assigned_lead_assigner_id = auth.uid());

CREATE POLICY "Lead assigners can update their assigned forms"
ON cpv_forms
FOR UPDATE
USING (assigned_lead_assigner_id = auth.uid());

-- Allow CPV agents to view forms they're assigned to through merchant status
CREATE POLICY "CPV agents can view assigned forms"
ON cpv_forms
FOR SELECT
USING (id IN (
  SELECT cpv_form_id 
  FROM cpv_merchant_status 
  WHERE assigned_cpv_agent_id = auth.uid()
));