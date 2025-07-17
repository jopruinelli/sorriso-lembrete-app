-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create locations table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  user_id UUID NOT NULL,
  location_id UUID NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  recurrence_type TEXT CHECK (recurrence_type IN ('none', 'monthly', 'semiannual', 'annual')) DEFAULT 'none',
  recurrence_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for locations
CREATE POLICY "locations_select_user_org" 
ON public.locations 
FOR SELECT 
USING (organization_id = get_user_organization_id());

CREATE POLICY "locations_insert_user_org" 
ON public.locations 
FOR INSERT 
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "locations_update_user_org" 
ON public.locations 
FOR UPDATE 
USING (organization_id = get_user_organization_id());

CREATE POLICY "locations_delete_user_org" 
ON public.locations 
FOR DELETE 
USING (organization_id = get_user_organization_id());

-- Create policies for appointments
CREATE POLICY "appointments_select_user_org" 
ON public.appointments 
FOR SELECT 
USING (organization_id = get_user_organization_id());

CREATE POLICY "appointments_insert_user_org" 
ON public.appointments 
FOR INSERT 
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "appointments_update_user_org" 
ON public.appointments 
FOR UPDATE 
USING (organization_id = get_user_organization_id());

CREATE POLICY "appointments_delete_user_org" 
ON public.appointments 
FOR DELETE 
USING (organization_id = get_user_organization_id());

-- Create foreign key constraints
ALTER TABLE public.locations ADD CONSTRAINT locations_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE public.appointments ADD CONSTRAINT appointments_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE public.appointments ADD CONSTRAINT appointments_patient_id_fkey 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);

ALTER TABLE public.appointments ADD CONSTRAINT appointments_location_id_fkey 
FOREIGN KEY (location_id) REFERENCES public.locations(id);

-- Create indexes for performance
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_organization_id ON public.appointments(organization_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_location_id ON public.appointments(location_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();