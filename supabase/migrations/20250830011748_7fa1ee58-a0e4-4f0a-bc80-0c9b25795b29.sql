-- Fix Critical Security Issues

-- 1. Fix privilege escalation: Prevent users from updating their own role
CREATE POLICY "Users cannot update their own role" 
ON public.user_profiles 
FOR UPDATE 
USING (
  auth.uid() != user_id 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.organization_id = user_profiles.organization_id 
    AND admin_profile.role = 'admin' 
    AND admin_profile.status = 'approved'
  )
);

-- 2. Fix data isolation: Update NULL organization_id in patients table
-- First, get organization_id from user_profiles for existing patients
UPDATE public.patients 
SET organization_id = (
  SELECT up.organization_id 
  FROM public.user_profiles up 
  WHERE up.user_id = patients.user_id 
  LIMIT 1
)
WHERE organization_id IS NULL;

-- 3. Fix data isolation: Update NULL organization_id in contact_records table  
UPDATE public.contact_records 
SET organization_id = (
  SELECT up.organization_id 
  FROM public.user_profiles up 
  WHERE up.user_id = contact_records.user_id 
  LIMIT 1
)
WHERE organization_id IS NULL;

-- 4. Add NOT NULL constraint to prevent future NULL organization_id
ALTER TABLE public.patients 
ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.contact_records 
ALTER COLUMN organization_id SET NOT NULL;

-- 5. Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL, 
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND organization_id = security_audit_log.organization_id 
    AND role = 'admin' 
    AND status = 'approved'
  )
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);