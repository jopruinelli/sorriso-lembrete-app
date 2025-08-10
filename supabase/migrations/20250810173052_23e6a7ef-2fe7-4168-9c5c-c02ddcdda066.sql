-- Add working hours columns to organization_settings and ensure upsert works
-- 1) Columns for working hours in 15-minute increments (store as numeric with 2 decimals)
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS working_hours_start numeric(5,2),
  ADD COLUMN IF NOT EXISTS working_hours_end numeric(5,2);

-- 2) Ensure upsert by organization_id works (requires unique index/constraint)
CREATE UNIQUE INDEX IF NOT EXISTS organization_settings_organization_id_uidx
  ON public.organization_settings (organization_id);

-- 3) Keep updated_at fresh on updates
DROP TRIGGER IF EXISTS update_org_settings_updated_at ON public.organization_settings;
CREATE TRIGGER update_org_settings_updated_at
BEFORE UPDATE ON public.organization_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();