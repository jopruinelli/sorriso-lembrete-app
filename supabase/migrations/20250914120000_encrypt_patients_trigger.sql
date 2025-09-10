-- Ensure patient phone and birth date are encrypted on write
CREATE OR REPLACE FUNCTION public.encrypt_patient_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.phone IS DISTINCT FROM OLD.phone THEN
    IF NEW.phone IS NOT NULL THEN
      NEW.phone := pgp_sym_encrypt(convert_from(NEW.phone, 'UTF8'), current_setting('app.encryption_key', true));
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.birth_date IS DISTINCT FROM OLD.birth_date THEN
    IF NEW.birth_date IS NOT NULL THEN
      NEW.birth_date := pgp_sym_encrypt(convert_from(NEW.birth_date, 'UTF8'), current_setting('app.encryption_key', true));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS encrypt_patients ON public.patients;
CREATE TRIGGER encrypt_patients
BEFORE INSERT OR UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.encrypt_patient_fields();

-- Expose decrypted values through a helper view for authorized users
CREATE OR REPLACE VIEW public.patients_secure AS
SELECT
  p.id,
  p.name,
  pgp_sym_decrypt(p.phone, current_setting('app.encryption_key', true))::text AS phone,
  p.secondary_phone,
  pgp_sym_decrypt(p.birth_date, current_setting('app.encryption_key', true))::date AS birth_date,
  p.last_visit,
  p.next_contact_reason,
  p.next_contact_date,
  p.status,
  p.inactive_reason,
  p.payment_type,
  p.location_id,
  p.organization_id,
  p.user_id,
  p.created_at,
  p.updated_at,
  p.updated_by
FROM public.patients AS p;

ALTER VIEW public.patients_secure OWNER TO postgres;

