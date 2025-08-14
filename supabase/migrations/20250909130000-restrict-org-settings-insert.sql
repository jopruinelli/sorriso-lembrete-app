-- Drop permissive policy allowing inserts from any user
DROP POLICY IF EXISTS org_settings_insert_any ON public.organization_settings;

-- Ensure only organization members can insert settings for their organization
DROP POLICY IF EXISTS organization_settings_insert_user_org ON public.organization_settings;
CREATE POLICY organization_settings_insert_user_org
  ON public.organization_settings
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
