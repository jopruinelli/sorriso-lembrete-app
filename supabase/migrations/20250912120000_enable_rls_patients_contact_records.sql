-- Ensure row level security is enabled for sensitive tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_records ENABLE ROW LEVEL SECURITY;
