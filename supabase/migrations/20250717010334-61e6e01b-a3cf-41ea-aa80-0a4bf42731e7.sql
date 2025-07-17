-- Insert default locations for existing organizations
INSERT INTO public.locations (organization_id, name, address) 
SELECT 
  id, 
  'Clínica Evolui', 
  'Balneário Camboriú'
FROM public.organizations
UNION ALL
SELECT 
  id, 
  'Clínica Riviera', 
  'Praia Brava - Itajaí'
FROM public.organizations
UNION ALL
SELECT 
  id, 
  'Clínica Ariele Mello', 
  'Balneário Camboriú'
FROM public.organizations;