-- First, drop the existing check constraint
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;

-- Add new check constraint that includes 'closed' status
ALTER TABLE patients ADD CONSTRAINT patients_status_check 
CHECK (status IN ('active', 'inactive', 'closed'));

-- Update existing 'inactive' patients to 'closed' status
UPDATE patients 
SET status = 'closed' 
WHERE status = 'inactive';