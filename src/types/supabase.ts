export interface DatabasePatient {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  phone: string;
  secondary_phone?: string;
  birth_date?: string;
  last_visit: string;
  next_contact_reason: string;
  next_contact_date: string;
  status: 'active' | 'inactive' | 'closed';
  inactive_reason?: string;
  payment_type: 'particular' | 'convenio';
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface DatabaseContactRecord {
  id: string;
  patient_id: string;
  user_id: string;
  organization_id?: string;
  date: string;
  method: 'phone' | 'whatsapp' | 'in-person' | 'other';
  notes?: string;
  successful: boolean;
  created_at: string;
}
