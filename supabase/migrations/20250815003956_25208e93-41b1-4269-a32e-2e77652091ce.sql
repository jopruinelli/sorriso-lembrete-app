-- Fix search_path for remaining function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Não criar automaticamente, deixar para o onboarding
  RETURN NEW;
END;
$$;