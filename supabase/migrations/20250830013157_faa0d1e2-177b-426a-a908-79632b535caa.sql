-- Add location_id column to patients table
ALTER TABLE public.patients 
ADD COLUMN location_id UUID;

-- Update existing patients to use the first location of their organization
UPDATE public.patients 
SET location_id = (
  SELECT l.id 
  FROM public.locations l 
  WHERE l.organization_id = patients.organization_id 
  AND l.is_active = true
  ORDER BY l.created_at ASC 
  LIMIT 1
)
WHERE location_id IS NULL;

-- Make location_id NOT NULL and add foreign key constraint
ALTER TABLE public.patients 
ALTER COLUMN location_id SET NOT NULL;

-- Add foreign key constraint to locations table
ALTER TABLE public.patients 
ADD CONSTRAINT fk_patients_location 
FOREIGN KEY (location_id) REFERENCES public.locations(id) 
ON DELETE RESTRICT;