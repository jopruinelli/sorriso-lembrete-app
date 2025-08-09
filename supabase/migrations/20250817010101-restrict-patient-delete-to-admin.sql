-- Restrict patient deletion to admins
DROP POLICY IF EXISTS "patients_delete_policy" ON patients;

CREATE POLICY "patients_delete_policy" ON patients
FOR DELETE USING (
  organization_id IS NOT NULL AND
  public.user_belongs_to_organization(organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_profile
    WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.organization_id = patients.organization_id
      AND admin_profile.role = 'admin'
      AND admin_profile.status = 'approved'
  )
);
