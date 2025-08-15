-- Fix the remaining function search path security issue
-- Update any functions that don't have search_path set properly

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