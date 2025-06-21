
-- Primeiro, vamos corrigir a função get_user_organization_id para evitar problemas de RLS
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Vamos também criar uma função para verificar se o usuário pertence a uma organização específica
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND organization_id = org_id
  );
$$;

-- Remover todas as políticas existentes e recriar com uma abordagem mais simples
DROP POLICY IF EXISTS "Users can view patients from their organization" ON patients;
DROP POLICY IF EXISTS "Users can create patients in their organization" ON patients;
DROP POLICY IF EXISTS "Users can update patients in their organization" ON patients;
DROP POLICY IF EXISTS "Users can delete patients in their organization" ON patients;

DROP POLICY IF EXISTS "Users can view contact records from their organization" ON contact_records;
DROP POLICY IF EXISTS "Users can create contact records in their organization" ON contact_records;
DROP POLICY IF EXISTS "Users can update contact records in their organization" ON contact_records;
DROP POLICY IF EXISTS "Users can delete contact records in their organization" ON contact_records;

-- Recriar políticas para a tabela patients com abordagem mais direta
CREATE POLICY "patients_select_policy" ON patients
  FOR SELECT USING (
    organization_id IS NOT NULL AND 
    public.user_belongs_to_organization(organization_id)
  );

CREATE POLICY "patients_insert_policy" ON patients
  FOR INSERT WITH CHECK (
    organization_id IS NOT NULL AND 
    public.user_belongs_to_organization(organization_id) AND
    user_id = auth.uid()
  );

CREATE POLICY "patients_update_policy" ON patients
  FOR UPDATE USING (
    organization_id IS NOT NULL AND 
    public.user_belongs_to_organization(organization_id) AND
    user_id = auth.uid()
  );

CREATE POLICY "patients_delete_policy" ON patients
  FOR DELETE USING (
    organization_id IS NOT NULL AND 
    public.user_belongs_to_organization(organization_id) AND
    user_id = auth.uid()
  );

-- Recriar políticas para a tabela contact_records
CREATE POLICY "contact_records_select_policy" ON contact_records
  FOR SELECT USING (
    organization_id IS NOT NULL AND 
    public.user_belongs_to_organization(organization_id)
  );

CREATE POLICY "contact_records_insert_policy" ON contact_records
  FOR INSERT WITH CHECK (
    organization_id IS NOT NULL AND 
    public.user_belongs_to_organization(organization_id) AND
    user_id = auth.uid()
  );

CREATE POLICY "contact_records_update_policy" ON contact_records
  FOR UPDATE USING (
    organization_id IS NOT NULL AND 
    public.user_belongs_to_organization(organization_id) AND
    user_id = auth.uid()
  );

CREATE POLICY "contact_records_delete_policy" ON contact_records
  FOR DELETE USING (
    organization_id IS NOT NULL AND 
    public.user_belongs_to_organization(organization_id) AND
    user_id = auth.uid()
  );
