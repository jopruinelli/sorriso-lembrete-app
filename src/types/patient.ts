
export interface Patient {
  id: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  birthDate?: Date;
  lastVisit: Date;
  nextContactReason: string;
  nextContactDate: Date;
  status: 'active' | 'inactive' | 'closed';
  inactiveReason?: string;
  paymentType: 'particular' | 'convenio';
  locationId: string;
  contactHistory: ContactRecord[];
  created_at: Date;
  updated_at?: Date;
  updated_by?: string;
}

export interface PatientCreateData {
  name: string;
  phone: string;
  secondaryPhone?: string;
  birthDate?: Date;
  lastVisit: Date;
  nextContactReason: string;
  nextContactDate: Date;
  status: 'active' | 'inactive' | 'closed';
  inactiveReason?: string;
  paymentType: 'particular' | 'convenio';
  locationId: string;
}

export interface ContactRecord {
  id: string;
  date: Date;
  method: 'phone' | 'whatsapp' | 'in-person' | 'other';
  notes: string;
  successful: boolean;
}

export type ContactPeriod =
  | 'overdue'
  | '1month'
  | '3months'
  | '6months'
  | '1year'
  | 'custom';
