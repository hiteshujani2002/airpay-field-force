-- Create a function to automatically sync CPV form assignments when merchant data is assigned
CREATE OR REPLACE FUNCTION sync_cpv_form_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- When merchant data is assigned to a Lead Assigner, ensure the CPV form is also marked as assigned
  IF NEW.assigned_lead_assigner_id IS NOT NULL AND NEW.assigned_lead_assigner_id != OLD.assigned_lead_assigner_id THEN
    UPDATE cpv_forms 
    SET assigned_lead_assigner_id = NEW.assigned_lead_assigner_id
    WHERE id = NEW.cpv_form_id 
    AND (assigned_lead_assigner_id IS NULL OR assigned_lead_assigner_id != NEW.assigned_lead_assigner_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync form assignments
CREATE TRIGGER sync_form_assignment_trigger
  AFTER INSERT OR UPDATE ON cpv_merchant_status
  FOR EACH ROW
  EXECUTE FUNCTION sync_cpv_form_assignment();