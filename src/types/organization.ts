
export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  organizations?: Organization; // Adicionar como opcional para incluir dados da organização
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  whatsapp_default_message: string;
  created_at: string;
  updated_at: string;
}
