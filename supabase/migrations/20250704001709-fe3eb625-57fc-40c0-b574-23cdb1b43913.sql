-- Update active patients with next contact date over 6 months ago to inactive status
UPDATE patients 
SET status = 'inactive',
    inactive_reason = 'Sem contato há mais de 6 meses',
    updated_at = now()
WHERE status = 'active' 
  AND next_contact_date < (CURRENT_DATE - INTERVAL '6 months');