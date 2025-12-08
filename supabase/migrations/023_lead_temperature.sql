-- Add temperature column to leads table
-- This separates "how hot is the lead" from "what stage is the lead at"

-- Add temperature column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS temperature VARCHAR(20) DEFAULT 'warm';

-- Add comment for clarity
COMMENT ON COLUMN leads.temperature IS 'Lead temperature: hot (ready to buy), warm (interested), cold (needs nurturing)';
COMMENT ON COLUMN leads.status IS 'Lead stage: new, contacted, qualified, negotiating, converted, lost';

-- Update existing leads to have temperature based on their current status
-- If status is hot/warm/cold, move it to temperature and set status to 'new'
UPDATE leads 
SET temperature = status, status = 'new' 
WHERE status IN ('hot', 'warm', 'cold');

-- Create index for temperature filtering
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(temperature);

-- Grant permissions
GRANT ALL ON leads TO authenticated;

