-- Create table for professionals within organizations
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  user_email TEXT,
  role TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}'::text[],
  location_ids UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Allow members of an organization to view its professionals
CREATE POLICY "professionals_select"
ON public.professionals
FOR SELECT
USING (
  organization_id IS NOT NULL AND
  public.user_belongs_to_organization(organization_id)
);

-- Allow admins to insert professionals
CREATE POLICY "professionals_insert_admin"
ON public.professionals
FOR INSERT
WITH CHECK (
  organization_id IS NOT NULL AND
  public.user_belongs_to_organization(organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_profile
    WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.organization_id = professionals.organization_id
      AND admin_profile.role = 'admin'
      AND admin_profile.status = 'approved'
  )
);

-- Allow admins to update professionals
CREATE POLICY "professionals_update_admin"
ON public.professionals
FOR UPDATE
USING (
  organization_id IS NOT NULL AND
  public.user_belongs_to_organization(organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_profile
    WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.organization_id = professionals.organization_id
      AND admin_profile.role = 'admin'
      AND admin_profile.status = 'approved'
  )
);

-- Allow admins to delete professionals
CREATE POLICY "professionals_delete_admin"
ON public.professionals
FOR DELETE
USING (
  organization_id IS NOT NULL AND
  public.user_belongs_to_organization(organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_profile
    WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.organization_id = professionals.organization_id
      AND admin_profile.role = 'admin'
      AND admin_profile.status = 'approved'
  )
);

-- Keep updated_at current on updates
CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
