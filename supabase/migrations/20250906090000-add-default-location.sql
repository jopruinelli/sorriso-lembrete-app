-- Add default flag to locations and ensure single default per organization
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

-- Create or replace validation function for locations
CREATE OR REPLACE FUNCTION public.validate_locations()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure there is always at least one active location
  IF TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.locations
        WHERE organization_id = NEW.organization_id
          AND is_active = true
          AND id <> NEW.id) = 0 THEN
      RAISE EXCEPTION 'Deve haver pelo menos um local ativo';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.locations
        WHERE organization_id = OLD.organization_id
          AND is_active = true
          AND id <> OLD.id) = 0 THEN
      RAISE EXCEPTION 'Deve haver pelo menos um local ativo';
    END IF;
  END IF;

  -- Handle default location logic
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.is_default = true THEN
      UPDATE public.locations
      SET is_default = false
      WHERE organization_id = NEW.organization_id
        AND id <> NEW.id;
    END IF;

    IF NEW.is_active = true THEN
      IF (SELECT COUNT(*) FROM public.locations
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
$$ LANGUAGE plpgsql;

-- Replace existing trigger
DROP TRIGGER IF EXISTS validate_active_locations_trigger ON public.locations;
CREATE TRIGGER validate_locations_trigger
BEFORE INSERT OR UPDATE OR DELETE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.validate_locations();

-- Drop old validation function if it exists
DROP FUNCTION IF EXISTS public.validate_active_locations();
