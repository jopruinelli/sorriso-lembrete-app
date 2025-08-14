-- Strengthen RLS policies for appointments to ensure organization isolation
DROP POLICY IF EXISTS "appointments_select_user_org" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_user_org" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_user_org" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_user_org" ON public.appointments;

CREATE POLICY "appointments_select_user_org"
ON public.appointments
FOR SELECT
USING (
  public.user_belongs_to_organization(organization_id)
);

CREATE POLICY "appointments_insert_user_org"
ON public.appointments
FOR INSERT
WITH CHECK (
  public.user_belongs_to_organization(organization_id)
);

CREATE POLICY "appointments_update_user_org"
ON public.appointments
FOR UPDATE
USING (
  public.user_belongs_to_organization(organization_id)
)
WITH CHECK (
  public.user_belongs_to_organization(organization_id)
);

CREATE POLICY "appointments_delete_user_org"
ON public.appointments
FOR DELETE
USING (
  public.user_belongs_to_organization(organization_id)
);
