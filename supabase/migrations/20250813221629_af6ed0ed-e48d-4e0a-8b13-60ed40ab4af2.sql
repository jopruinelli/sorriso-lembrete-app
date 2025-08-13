-- Security Fixes Migration

-- Phase 1: Fix Privilege Escalation - Prevent users from updating their own role
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;

-- Create new policy that excludes role updates for regular users
CREATE POLICY "user_profiles_update_own_no_role" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND OLD.role = NEW.role  -- Prevent role changes in self-updates
);

-- Create admin-only role update policy
CREATE POLICY "user_profiles_update_role_admin_only" 
ON public.user_profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles admin_profile
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.organization_id = user_profiles.organization_id 
    AND admin_profile.role = 'admin'
    AND admin_profile.status = 'approved'
  )
);

-- Phase 2: Fix Organization Data Exposure
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organizations;

-- Create organization-specific access policy
CREATE POLICY "organizations_select_user_org" 
ON public.organizations 
FOR SELECT 
USING (
  id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND status = 'approved'
  )
);

-- Phase 3: Fix Database Function Security
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id 
  FROM public.user_profiles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id
    AND status = 'approved'
  );
$$;