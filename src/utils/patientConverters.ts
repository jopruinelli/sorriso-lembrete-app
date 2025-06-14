
import { Patient, ContactRecord } from '@/types/patient';
import { DatabasePatient } from '@/types/supabase';

export const convertToDbPatient = (
  patient: Omit<Patient, 'id' | 'contactHistory'>,
  userId: string,
  organizationId: string
): Omit<DatabasePatient, 'id' | 'created_at' | 'updated_at'> => {
  console.log('🔄 Converting to DB patient:', {
    patientName: patient.name,
    userId,
    organizationId,
    hasAllRequired: !!(patient.name && patient.phone && userId && organizationId)
  });

  const dbPatient = {
    name: patient.name,
    phone: patient.phone,
    secondary_phone: patient.secondaryPhone || null,
    last_visit: patient.lastVisit.toISOString(),
    next_contact_reason: patient.nextContactReason,
    next_contact_date: patient.nextContactDate.toISOString(),
    status: patient.status,
    inactive_reason: patient.inactiveReason || null,
    payment_type: patient.paymentType,
    user_id: userId,
    organization_id: organizationId
  };

  console.log('📋 DB patient created:', dbPatient);
  return dbPatient;
};

export const convertToAppPatient = (
  dbPatient: DatabasePatient,
  contactHistory: ContactRecord[] = []
): Patient => {
  return {
    id: dbPatient.id,
    name: dbPatient.name,
    phone: dbPatient.phone,
    secondaryPhone: dbPatient.secondary_phone || undefined,
    lastVisit: new Date(dbPatient.last_visit),
    nextContactReason: dbPatient.next_contact_reason,
    nextContactDate: new Date(dbPatient.next_contact_date),
    status: dbPatient.status as 'active' | 'inactive',
    inactiveReason: dbPatient.inactive_reason || undefined,
    paymentType: dbPatient.payment_type as 'particular' | 'convenio',
    contactHistory
  };
};

export const assertDatabasePatient = (data: any): DatabasePatient => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid patient data: not an object');
  }

  const required = ['id', 'name', 'phone', 'last_visit', 'next_contact_reason', 'next_contact_date', 'user_id'];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Invalid patient data: missing ${field}`);
    }
  }

  return data as DatabasePatient;
};
