-- Add status tracking and merchant management fields to cpv_forms table
ALTER TABLE public.cpv_forms 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN current_status TEXT DEFAULT 'draft' CHECK (current_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
ADD COLUMN assigned_lead_assigner_id UUID,
ADD COLUMN merchants_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN form_preview_data JSONB;

-- Create index for better performance on status queries
CREATE INDEX idx_cpv_forms_status ON public.cpv_forms(status);
CREATE INDEX idx_cpv_forms_current_status ON public.cpv_forms(current_status);
CREATE INDEX idx_cpv_forms_assigned_lead_assigner ON public.cpv_forms(assigned_lead_assigner_id);

-- Update RLS policies to include new columns
-- The existing RLS policies will automatically apply to the new columns since they're user-scoped

-- Add comments for documentation
COMMENT ON COLUMN public.cpv_forms.status IS 'Active/Inactive status of the form';
COMMENT ON COLUMN public.cpv_forms.current_status IS 'Current workflow status of the form';
COMMENT ON COLUMN public.cpv_forms.assigned_lead_assigner_id IS 'ID of the assigned lead assigner';
COMMENT ON COLUMN public.cpv_forms.merchants_data IS 'Array of merchant data associated with this form';
COMMENT ON COLUMN public.cpv_forms.form_preview_data IS 'Cached form structure for quick preview display';