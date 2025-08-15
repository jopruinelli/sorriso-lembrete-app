-- Add missing DELETE policy for organization_settings table
CREATE POLICY "org_settings_delete_user_org" 
ON public.organization_settings 
FOR DELETE 
TO authenticated
USING (organization_id = get_user_organization_id());