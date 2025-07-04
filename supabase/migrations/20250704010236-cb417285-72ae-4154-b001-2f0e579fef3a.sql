-- Make method and successful columns nullable and add defaults for contact_records table
ALTER TABLE public.contact_records 
  ALTER COLUMN method SET DEFAULT 'whatsapp',
  ALTER COLUMN method DROP NOT NULL,
  ALTER COLUMN successful SET DEFAULT true;