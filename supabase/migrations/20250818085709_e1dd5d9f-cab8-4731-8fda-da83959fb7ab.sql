-- Add CPV agent assignment functionality to cpv_merchant_status table
ALTER TABLE cpv_merchant_status 
ADD COLUMN assigned_cpv_agent_id uuid,
ADD COLUMN cpv_agent_assigned_on timestamp with time zone;

-- Add index for better performance on CPV agent queries
CREATE INDEX idx_cpv_merchant_status_cpv_agent ON cpv_merchant_status(assigned_cpv_agent_id);

-- Enable realtime for cpv_merchant_status table
ALTER TABLE cpv_merchant_status REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE cpv_merchant_status;