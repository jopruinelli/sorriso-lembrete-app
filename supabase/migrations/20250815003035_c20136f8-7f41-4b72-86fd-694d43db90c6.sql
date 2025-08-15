-- Fix search_path for validation functions

CREATE OR REPLACE FUNCTION public.validate_appointment_titles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If trying to deactivate a title, check if there would be any active ones left
  IF TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.appointment_titles 
        WHERE organization_id = NEW.organization_id 
        AND is_active = true 
        AND id != NEW.id) = 0 THEN
      RAISE EXCEPTION 'Deve haver pelo menos um título ativo';
    END IF;
  END IF;
  
  -- If trying to delete an active title, check if there would be any active ones left
  IF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.appointment_titles 
        WHERE organization_id = OLD.organization_id 
        AND is_active = true 
        AND id != OLD.id) = 0 THEN
      RAISE EXCEPTION 'Deve haver pelo menos um título ativo';
    END IF;
  END IF;
  
  -- If setting a title as default, ensure only one default exists
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.is_default = true THEN
      UPDATE public.appointment_titles 
      SET is_default = false 
      WHERE organization_id = NEW.organization_id 
      AND id != NEW.id;
    END IF;
    
    -- Ensure at least one title is default if this is the only active one
    IF NEW.is_active = true THEN
      IF (SELECT COUNT(*) FROM public.appointment_titles 
          WHERE organization_id = NEW.organization_id 
          AND is_active = true 
          AND is_default = true) = 0 THEN
        NEW.is_default = true;
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_active_locations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If trying to deactivate a location, check if there would be any active ones left
  IF TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.locations 
        WHERE organization_id = NEW.organization_id 
        AND is_active = true 
        AND id != NEW.id) = 0 THEN
      RAISE EXCEPTION 'Deve haver pelo menos um local ativo';
    END IF;
  END IF;
  
  -- If trying to delete an active location, check if there would be any active ones left
  IF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.locations 
        WHERE organization_id = OLD.organization_id 
        AND is_active = true 
        AND id != OLD.id) = 0 THEN
      RAISE EXCEPTION 'Deve haver pelo menos um local ativo';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;