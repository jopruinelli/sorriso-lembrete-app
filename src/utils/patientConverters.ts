
import { Patient, ContactRecord } from '@/types/patient';
import { DatabasePatient } from '@/types/supabase';

// Convert database format to app format
export const convertToAppPatient = (dbPatient: DatabasePatient, contactHistory: ContactRecord[] = []): Patient => ({
  id: dbPatient.id,
  name: dbPatient.name,
  phone: dbPatient.phone,
  secondaryPhone: dbPatient.secondary_phone,
  lastVisit: new Date(dbPatient.last_visit),
  nextContactReason: dbPatient.next_contact_reason,
  nextContactDate: new Date(dbPatient.next_contact_date),
  status: dbPatient.status,
  inactiveReason: dbPatient.inactive_reason,
  paymentType: dbPatient.payment_type,
  contactHistory
});

// Convert app format to database format
export const convertToDbPatient = (appPatient: Omit<Patient, 'id' | 'contactHistory'>, userId: string, organizationId: string): Omit<DatabasePatient, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  organization_id: organizationId,
  name: appPatient.name,
  phone: appPatient.phone,
  secondary_phone: appPatient.secondaryPhone,
  last_visit: appPatient.lastVisit.toISOString(),
  next_contact_reason: appPatient.nextContactReason,
  next_contact_date: appPatient.nextContactDate.toISOString(),
  status: appPatient.status,
  inactive_reason: appPatient.inactiveReason,
  payment_type: appPatient.paymentType
});

// Type assertion helper for Supabase data
export const assertDatabasePatient = (data: any): DatabasePatient => ({
  ...data,
  status: data.status as 'active' | 'inactive',
  payment_type: data.payment_type as 'particular' | 'convenio'
});
