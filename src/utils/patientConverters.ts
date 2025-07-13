
import { PatientCreateData, ContactRecord } from '@/types/patient';
import { DatabasePatient } from '@/types/supabase';

export const convertToDbPatient = (
  patient: PatientCreateData,
  userId: string,
  organizationId: string
): Omit<DatabasePatient, 'id' | 'created_at' | 'updated_at'> => {
  console.log('🔄 Converting to DB patient:', {
    patientName: patient.name,
    userId,
    organizationId,
    hasAllRequired: !!(patient.name && patient.phone && userId && organizationId)
  });

  if (!organizationId) {
    throw new Error('Organization ID is required for patient creation');
  }

  if (!userId) {
    throw new Error('User ID is required for patient creation');
  }

  const dbPatient = {
    name: patient.name,
    phone: patient.phone,
    secondary_phone: patient.secondaryPhone || null,
    birth_date: patient.birthDate ? patient.birthDate.toISOString() : null,
    last_visit: patient.lastVisit.toISOString(),
    next_contact_reason: patient.nextContactReason,
    next_contact_date: patient.nextContactDate.toISOString(),
    status: patient.status,
    inactive_reason: patient.inactiveReason || null,
    payment_type: patient.paymentType,
    user_id: userId,
    organization_id: organizationId,
    updated_by: null
  };

  console.log('📋 DB patient created:', dbPatient);
  return dbPatient;
};

export const convertToAppPatient = (
  dbPatient: DatabasePatient,
  contactHistory: ContactRecord[] = []
) => {
  return {
    id: dbPatient.id,
    name: dbPatient.name,
    phone: dbPatient.phone,
    secondaryPhone: dbPatient.secondary_phone || undefined,
    birthDate: dbPatient.birth_date ? new Date(dbPatient.birth_date) : undefined,
    lastVisit: new Date(dbPatient.last_visit),
    nextContactReason: dbPatient.next_contact_reason,
    nextContactDate: new Date(dbPatient.next_contact_date),
    status: dbPatient.status as 'active' | 'inactive' | 'closed',
    inactiveReason: dbPatient.inactive_reason || undefined,
    paymentType: dbPatient.payment_type as 'particular' | 'convenio',
    contactHistory,
    created_at: new Date(dbPatient.created_at),
    updated_at: dbPatient.updated_at ? new Date(dbPatient.updated_at) : undefined,
    updated_by: dbPatient.updated_by || undefined
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
