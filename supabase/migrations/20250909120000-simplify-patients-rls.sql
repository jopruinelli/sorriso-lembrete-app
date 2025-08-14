-- Simplify patients RLS policies and ensure only authorized providers can access data
-- Define helper functions for provider and admin checks
CREATE OR REPLACE FUNCTION public.user_is_provider_in_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND status = 'approved'
      AND role IN ('admin', 'user')
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_admin_in_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND status = 'approved'
      AND role = 'admin'
  );
$$;

-- Drop existing patients policies to avoid overlaps
DROP POLICY IF EXISTS "patients_select_policy" ON patients;
DROP POLICY IF EXISTS "patients_insert_policy" ON patients;
DROP POLICY IF EXISTS "patients_update_policy" ON patients;
DROP POLICY IF EXISTS "patients_delete_policy" ON patients;

-- Restrict read access to approved providers from same organization
CREATE POLICY "patients_select_policy" ON patients
  FOR SELECT USING (
    organization_id IS NOT NULL AND
    public.user_is_provider_in_org(organization_id)
  );

-- Allow inserts only from approved providers in same organization
CREATE POLICY "patients_insert_policy" ON patients
  FOR INSERT WITH CHECK (
    organization_id IS NOT NULL AND
    public.user_is_provider_in_org(organization_id)
  );

-- Allow updates only from approved providers in same organization
CREATE POLICY "patients_update_policy" ON patients
  FOR UPDATE USING (
    organization_id IS NOT NULL AND
    public.user_is_provider_in_org(organization_id)
  ) WITH CHECK (
    organization_id IS NOT NULL AND
    public.user_is_provider_in_org(organization_id)
  );

-- Restrict deletes to organization admins
CREATE POLICY "patients_delete_policy" ON patients
  FOR DELETE USING (
    organization_id IS NOT NULL AND
    public.user_is_admin_in_org(organization_id)
  );
