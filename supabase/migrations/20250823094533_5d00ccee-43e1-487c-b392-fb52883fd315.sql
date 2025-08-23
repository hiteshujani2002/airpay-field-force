-- Fix the search path for the sync function
CREATE OR REPLACE FUNCTION sync_cpv_form_assignment()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When merchant data is assigned to a Lead Assigner, ensure the CPV form is also marked as assigned
  IF NEW.assigned_lead_assigner_id IS NOT NULL AND (OLD.assigned_lead_assigner_id IS NULL OR NEW.assigned_lead_assigner_id != OLD.assigned_lead_assigner_id) THEN
    UPDATE cpv_forms 
    SET assigned_lead_assigner_id = NEW.assigned_lead_assigner_id
    WHERE id = NEW.cpv_form_id 
    AND (assigned_lead_assigner_id IS NULL OR assigned_lead_assigner_id != NEW.assigned_lead_assigner_id);
  END IF;
  
  RETURN NEW;
END;
$$;