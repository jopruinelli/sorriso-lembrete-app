
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
  status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  organizations?: Organization;
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  whatsapp_default_message: string;
  whatsapp_appointment_message: string;
  working_hours_start: number | null;
  working_hours_end: number | null;
  created_at: string;
  updated_at: string;
}
