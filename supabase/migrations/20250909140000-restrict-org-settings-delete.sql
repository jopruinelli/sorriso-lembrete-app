-- Restrict deletion of organization settings to organization members
DROP POLICY IF EXISTS org_settings_delete_any ON public.organization_settings;

DROP POLICY IF EXISTS organization_settings_delete_user_org ON public.organization_settings;
CREATE POLICY organization_settings_delete_user_org
  ON public.organization_settings
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());
