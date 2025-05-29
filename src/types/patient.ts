
export interface Patient {
  id: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  lastVisit: Date;
  nextContactReason: string;
  nextContactDate: Date;
  status: 'active' | 'inactive';
  inactiveReason?: string;
  paymentType: 'particular' | 'convenio';
  contactHistory: ContactRecord[];
}

export interface ContactRecord {
  id: string;
  date: Date;
  method: 'phone' | 'whatsapp' | 'in-person' | 'other';
  notes: string;
  successful: boolean;
}

export type ContactPeriod = '1month' | '3months' | '6months' | '1year' | 'custom';
