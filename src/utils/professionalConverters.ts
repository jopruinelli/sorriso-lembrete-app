import { Professional } from '@/types/professional';
import { DatabaseProfessional } from '@/types/supabase';

export const convertToDbProfessional = (
  professional: Omit<Professional, 'id'>,
  organizationId: string
): Omit<DatabaseProfessional, 'id' | 'created_at' | 'updated_at'> => ({
  organization_id: organizationId,
  first_name: professional.firstName,
  last_name: professional.lastName,
  user_email: professional.user || null,
  role: professional.role,
  specialties: professional.specialties,
  location_ids: professional.locations
});

export const convertToAppProfessional = (
  dbProfessional: DatabaseProfessional
): Professional => ({
  id: dbProfessional.id,
  firstName: dbProfessional.first_name,
  lastName: dbProfessional.last_name,
  user: dbProfessional.user_email || undefined,
  role: dbProfessional.role,
  specialties: dbProfessional.specialties || [],
  locations: dbProfessional.location_ids || []
});

export const assertDatabaseProfessional = (data: unknown): DatabaseProfessional => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid professional data: not an object');
  }

  const required = ['id', 'first_name', 'last_name', 'role', 'organization_id'];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Invalid professional data: missing ${field}`);
    }
  }

  return data as DatabaseProfessional;
};
