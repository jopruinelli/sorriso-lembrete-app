-- 1. Require approved status in org lookup
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT organization_id
  FROM public.user_profiles
  WHERE user_id = auth.uid()
    AND status = 'approved'
  LIMIT 1;
$$;

-- 2. Fix mutable search_path on encrypt_patient_fields
CREATE OR REPLACE FUNCTION public.encrypt_patient_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := extensions.pgp_sym_encrypt(NEW.phone::text, current_setting('app.encryption_key', true));
  END IF;
  IF NEW.birth_date IS NOT NULL THEN
    NEW.birth_date := extensions.pgp_sym_encrypt(NEW.birth_date::text, current_setting('app.encryption_key', true));
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Prevent self escalation of role/status
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF auth.uid() = OLD.user_id THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Users cannot change their own role or status';
    END IF;
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Users cannot change their own organization';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_escalation_trigger ON public.user_profiles;
CREATE TRIGGER prevent_self_role_escalation_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- 4. Restrict organization creation to users without an existing profile
DROP POLICY IF EXISTS organizations_insert_authenticated ON public.organizations;
CREATE POLICY organizations_insert_authenticated
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid()
  )
);

-- 5. Remove anonymous exposure of all tables (GraphQL/PostgREST discoverability)
REVOKE ALL ON public.appointment_titles FROM anon;
REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.contact_records FROM anon;
REVOKE ALL ON public.locations FROM anon;
REVOKE ALL ON public.organization_settings FROM anon;
REVOKE ALL ON public.organizations FROM anon;
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.professional_roles FROM anon;
REVOKE ALL ON public.professionals FROM anon;
REVOKE ALL ON public.security_audit_log FROM anon;
REVOKE ALL ON public.user_profiles FROM anon;

-- 6. Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.encrypt_patient_fields() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_active_locations() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_appointment_titles() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_self_role_escalation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_belongs_to_organization(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_organization(uuid) TO authenticated;