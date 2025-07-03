-- Update existing 'inactive' patients to 'closed' status
UPDATE patients 
SET status = 'closed' 
WHERE status = 'inactive';