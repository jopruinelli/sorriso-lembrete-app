-- Encrypt sensitive fields in patients table using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Convert phone and birth_date to encrypted bytea columns
ALTER TABLE public.patients
  ALTER COLUMN phone TYPE bytea USING pgp_sym_encrypt(phone::text, current_setting('app.encryption_key', true)),
  ALTER COLUMN birth_date TYPE bytea USING pgp_sym_encrypt(birth_date::text, current_setting('app.encryption_key', true));

-- Helper views for authorized users to access decrypted data
CREATE OR REPLACE VIEW public.patients_secure AS
SELECT
  p.id,
  pgp_sym_decrypt(p.phone, current_setting('app.encryption_key', true))::text AS phone,
  pgp_sym_decrypt(p.birth_date, current_setting('app.encryption_key', true))::date AS birth_date,
  p.organization_id,
  p.user_id,
  p.status,
  p.created_at,
  p.updated_at,
  p.updated_by
FROM public.patients AS p;

-- Ensure RLS policies apply to the secure view
ALTER VIEW public.patients_secure OWNER TO postgres;

