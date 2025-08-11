-- Add missing WhatsApp birthday message column and ensure upsert works by making organization_id unique
-- 1) Add whatsapp_birthday_message with a sensible default
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS whatsapp_birthday_message TEXT
  DEFAULT 'Olá {nome_do_paciente}! Feliz aniversário! Desejamos um dia cheio de sorrisos!';

-- 2) Backfill NULLs to the default text to avoid unexpected nulls in app code
UPDATE public.organization_settings
SET whatsapp_birthday_message = 'Olá {nome_do_paciente}! Feliz aniversário! Desejamos um dia cheio de sorrisos!'
WHERE whatsapp_birthday_message IS NULL;

-- 3) Ensure there is only one settings row per organization and allow onConflict upserts
CREATE UNIQUE INDEX IF NOT EXISTS organization_settings_organization_id_unique
ON public.organization_settings (organization_id);
