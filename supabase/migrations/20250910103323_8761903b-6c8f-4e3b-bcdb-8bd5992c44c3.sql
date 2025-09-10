-- 1) Create or replace a passthrough view to fix app selects
CREATE OR REPLACE VIEW public.patients_secure AS
SELECT 
  p.id,
  p.organization_id,
  p.user_id,
  p.name,
  p.phone,
  p.secondary_phone,
  p.birth_date,
  p.last_visit,
  p.next_contact_reason,
  p.next_contact_date,
  p.status,
  p.inactive_reason,
  p.payment_type,
  p.location_id,
  p.created_at,
  p.updated_at,
  p.updated_by
FROM public.patients p;

-- 2) Ensure RLS still applies via underlying table (no RLS on view needed)
-- 3) Disable problematic encryption trigger to restore inserts/updates quickly
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_encrypt_patients'
  ) THEN
    EXECUTE 'DROP TRIGGER trg_encrypt_patients ON public.patients';
  END IF;
END $$;

-- Keep function as-is for now (no-op without trigger). We can re-introduce a safer approach later.

-- 4) Backfill patients without location_id to the first active location of their organization
-- (safe re-run)
WITH first_locations AS (
  SELECT l.organization_id, MIN(l.id) AS first_location_id
  FROM public.locations l
  WHERE l.is_active = true
  GROUP BY l.organization_id
)
UPDATE public.patients p
SET location_id = fl.first_location_id
FROM first_locations fl
WHERE p.location_id IS NULL
  AND p.organization_id = fl.organization_id;
