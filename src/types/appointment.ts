export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  organization_id: string;
  patient_id: string;
  user_id: string;
  location_id: string;
  title: string;
  start_time: string;
  end_time: string;
  notes?: string;
  recurrence_type: 'none' | 'monthly' | 'semiannual' | 'annual';
  recurrence_end_date?: string;
  created_at: string;
  updated_at: string;
  patient?: {
    name: string;
    phone: string;
  };
  location?: {
    name: string;
    address?: string;
  };
}

export interface AppointmentFormData {
  patient_id: string;
  location_id: string;
  title: string;
  start_time: Date;
  end_time: Date;
  notes?: string;
  recurrence_type: 'none' | 'monthly' | 'semiannual' | 'annual';
  recurrence_end_date?: Date;
}