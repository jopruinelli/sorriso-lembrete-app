-- Add working hours columns and policies to organization_settings
ALTER TABLE IF EXISTS public.organization_settings
  ADD COLUMN IF NOT EXISTS working_hours_start numeric NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS working_hours_end numeric NOT NULL DEFAULT 18;

-- Ensure row level security is enabled
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Allow members to read their organization's settings
CREATE POLICY IF NOT EXISTS "organization_settings_select_user_org"
  ON public.organization_settings
  FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Allow members to insert settings for their organization
CREATE POLICY IF NOT EXISTS "organization_settings_insert_user_org"
  ON public.organization_settings
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Allow members to update settings for their organization
CREATE POLICY IF NOT EXISTS "organization_settings_update_user_org"
  ON public.organization_settings
  FOR UPDATE
  USING (organization_id = get_user_organization_id());
