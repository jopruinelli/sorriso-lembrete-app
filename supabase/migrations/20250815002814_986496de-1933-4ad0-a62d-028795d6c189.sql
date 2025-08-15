-- Phase 1: Critical Access Control Fixes

-- Drop the overly permissive organization insert policy
DROP POLICY IF EXISTS "organizations_insert_any" ON public.organizations;

-- Create a restrictive policy for organization creation (only authenticated users)
CREATE POLICY "organizations_insert_authenticated" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Drop the overly permissive organization settings insert policy
DROP POLICY IF EXISTS "org_settings_insert_any" ON public.organization_settings;

-- Create a restrictive policy for organization settings creation
-- Only allow users who belong to the organization to create settings
CREATE POLICY "org_settings_insert_authenticated" 
ON public.organization_settings 
FOR INSERT 
TO authenticated
WITH CHECK (user_belongs_to_organization(organization_id));