-- Create appointment titles table
CREATE TABLE public.appointment_titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_titles ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment titles
CREATE POLICY "appointment_titles_select_user_org" 
ON public.appointment_titles 
FOR SELECT 
USING (organization_id = get_user_organization_id());

CREATE POLICY "appointment_titles_insert_user_org" 
ON public.appointment_titles 
FOR INSERT 
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "appointment_titles_update_user_org" 
ON public.appointment_titles 
FOR UPDATE 
USING (organization_id = get_user_organization_id());

CREATE POLICY "appointment_titles_delete_user_org" 
ON public.appointment_titles 
FOR DELETE 
USING (organization_id = get_user_organization_id());

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_appointment_titles_updated_at
BEFORE UPDATE ON public.appointment_titles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add active status to locations table
ALTER TABLE public.locations 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Function to ensure at least one active location exists
CREATE OR REPLACE FUNCTION public.validate_active_locations()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Function to ensure at least one active appointment title exists and only one default
CREATE OR REPLACE FUNCTION public.validate_appointment_titles()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER validate_active_locations_trigger
BEFORE UPDATE OR DELETE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.validate_active_locations();

CREATE TRIGGER validate_appointment_titles_trigger
BEFORE INSERT OR UPDATE OR DELETE ON public.appointment_titles
FOR EACH ROW
EXECUTE FUNCTION public.validate_appointment_titles();