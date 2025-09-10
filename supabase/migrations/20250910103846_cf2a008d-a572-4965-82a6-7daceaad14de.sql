-- Hotfix: disable encryption trigger that is breaking inserts/updates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_encrypt_patients'
  ) THEN
    EXECUTE 'DROP TRIGGER trg_encrypt_patients ON public.patients';
  END IF;
END $$;