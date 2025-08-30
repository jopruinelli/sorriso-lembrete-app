-- Create table for managing professional roles within organizations
CREATE TABLE public.professional_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  main_area TEXT NOT NULL,
  sub_area TEXT,
  role TEXT NOT NULL,
  specialty TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.professional_roles ENABLE ROW LEVEL SECURITY;

-- Allow members of an organization to view its professional roles
CREATE POLICY "professional_roles_select"
ON public.professional_roles
FOR SELECT
USING (
  organization_id IS NOT NULL AND
  public.user_belongs_to_organization(organization_id)
);

-- Allow admins to insert professional roles
CREATE POLICY "professional_roles_insert_admin"
ON public.professional_roles
FOR INSERT
WITH CHECK (
  organization_id IS NOT NULL AND
  public.user_belongs_to_organization(organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_profile
    WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.organization_id = professional_roles.organization_id
      AND admin_profile.role = 'admin'
      AND admin_profile.status = 'approved'
  )
);

-- Allow admins to update professional roles
CREATE POLICY "professional_roles_update_admin"
ON public.professional_roles
FOR UPDATE
USING (
  organization_id IS NOT NULL AND
  public.user_belongs_to_organization(organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_profile
    WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.organization_id = professional_roles.organization_id
      AND admin_profile.role = 'admin'
      AND admin_profile.status = 'approved'
  )
);

-- Allow admins to delete professional roles
CREATE POLICY "professional_roles_delete_admin"
ON public.professional_roles
FOR DELETE
USING (
  organization_id IS NOT NULL AND
  public.user_belongs_to_organization(organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_profile
    WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.organization_id = professional_roles.organization_id
      AND admin_profile.role = 'admin'
      AND admin_profile.status = 'approved'
  )
);

-- Keep updated_at current on updates
CREATE TRIGGER update_professional_roles_updated_at
BEFORE UPDATE ON public.professional_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default roles for the first organization (can be customized per organization later)
INSERT INTO public.professional_roles (organization_id, main_area, sub_area, role, specialty)
VALUES
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Odontologia', 'Dentista', 'Clínico Geral'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Odontologia', 'Dentista', 'Odontopediatria'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Odontologia', 'Dentista', 'Ortodontia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Odontologia', 'Dentista', 'Implantodontia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Odontologia', 'Dentista', 'Cirurgia Bucomaxilofacial'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Odontologia', 'Dentista', 'Endodontia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Odontologia', 'Dentista', 'Periodontia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Odontologia', 'Dentista', 'Estomatologia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Odontologia', 'Dentista', 'Odontogeriatria'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Clínico Geral'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Pediatria'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Ginecologia e Obstetrícia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Ortopedia e Traumatologia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Dermatologia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Cardiologia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Psiquiatria'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Oftalmologia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Otorrinolaringologia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Endocrinologia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Medicina', 'Médico', 'Gastroenterologia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Nutrição', 'Nutricionista', 'Nutrição Clínica'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Nutrição', 'Nutricionista', 'Nutrição Esportiva'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Nutrição', 'Nutricionista', 'Nutrição Funcional'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Nutrição', 'Nutricionista', 'Nutrição Infantil'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Nutrição', 'Nutricionista', 'Nutrição Estética'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Psicologia', 'Psicólogo', 'Psicologia Clínica'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Psicologia', 'Psicólogo', 'Psicologia Infantil'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Psicologia', 'Psicólogo', 'Neuropsicologia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Psicologia', 'Psicólogo', 'Psicanálise'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Psicologia', 'Psicólogo', 'Psicologia Organizacional'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Psicologia', 'Psicólogo', 'Psicopedagogia'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Fisioterapia', 'Fisioterapeuta', 'Ortopédica'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Fisioterapia', 'Fisioterapeuta', 'Neurológica'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Fisioterapia', 'Fisioterapeuta', 'Respiratória'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Fisioterapia', 'Fisioterapeuta', 'Esportiva'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Fisioterapia', 'Fisioterapeuta', 'Pediátrica'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Fonoaudiologia', 'Fonoaudiólogo', NULL),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Enfermagem', 'Enfermeiro', NULL),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Enfermagem', 'Técnico de Enfermagem', NULL),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Outros', 'Farmacêutico', NULL),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Outros', 'Biomédico', NULL),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Outros', 'Educador Físico', NULL),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Outros', 'Terapeuta Ocupacional', NULL),
  ((SELECT id FROM public.organizations LIMIT 1), 'Saúde', 'Outros', 'Terapeuta Integrativo', 'Acupuntura / Reiki / Holístico'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Administração', 'Administrativo', 'Recepcionista', 'Recepção'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Administração', 'Administrativo', 'Assistente Administrativo', 'Financeiro'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Administração', 'Administrativo', 'Assistente Administrativo', 'Agenda / Secretaria'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Administração', 'Administrativo', 'Atendente', 'Atendimento ao Cliente'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Administração', 'Administrativo', 'Auxiliar de Consultório', 'Apoio Operacional'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Jurídico', 'Direito', 'Advogado', 'Direito Trabalhista'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Jurídico', 'Direito', 'Advogado', 'Direito Civil'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Jurídico', 'Direito', 'Advogado', 'Direito Penal'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Jurídico', 'Direito', 'Advogado', 'Direito de Família'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Jurídico', 'Direito', 'Advogado', 'Direito Tributário'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Jurídico', 'Direito', 'Advogado', 'Direito Empresarial'),
  ((SELECT id FROM public.organizations LIMIT 1), 'Contabilidade', 'Contabilidade', 'Contador', NULL),
  ((SELECT id FROM public.organizations LIMIT 1), 'Consultoria', 'Consultoria', 'Consultor', NULL),
  ((SELECT id FROM public.organizations LIMIT 1), 'Consultoria', 'Consultoria', 'Coach / Mentor', NULL),
  ((SELECT id FROM public.organizations LIMIT 1), 'Consultoria', 'Consultoria', 'Outros', NULL);
