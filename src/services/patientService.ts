
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/patient';
import { DatabasePatient } from '@/types/supabase';
import { convertToDbPatient, assertDatabasePatient } from '@/utils/patientConverters';

export class PatientService {
  static async loadPatients(organizationId: string) {
    const { data: patientsData, error } = await supabase
      .from('patients')
      .select('*')
      .eq('organization_id', organizationId)
      .order('next_contact_date', { ascending: true });

    if (error) throw error;

    return patientsData?.map(patient => assertDatabasePatient(patient)) || [];
  }

  static async addPatient(patientData: Omit<Patient, 'id' | 'contactHistory'>, userId: string, organizationId: string) {
    const dbPatient = convertToDbPatient(patientData, userId, organizationId);
    const { data, error } = await supabase
      .from('patients')
      .insert([dbPatient])
      .select()
      .single();

    if (error) throw error;

    return assertDatabasePatient(data);
  }

  static async updatePatient(patientId: string, patientData: Omit<Patient, 'id' | 'contactHistory'>, userId: string, organizationId: string) {
    const dbPatient = convertToDbPatient(patientData, userId, organizationId);
    const { error } = await supabase
      .from('patients')
      .update({ ...dbPatient, updated_at: new Date().toISOString() })
      .eq('id', patientId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  }

  static async deletePatient(patientId: string, organizationId: string) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  }

  static async bulkAddPatients(patientsData: Omit<Patient, 'id' | 'contactHistory'>[], userId: string, organizationId: string) {
    const dbPatients = patientsData.map(patient => convertToDbPatient(patient, userId, organizationId));
    const { data, error } = await supabase
      .from('patients')
      .insert(dbPatients)
      .select();

    if (error) throw error;

    return data?.length || 0;
  }

  static async bulkDeletePatients(patientIds: string[], organizationId: string) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .in('id', patientIds)
      .eq('organization_id', organizationId);

    if (error) throw error;
  }

  static async updateNextContactDate(patientId: string, nextContactDate: Date, organizationId: string) {
    const { error } = await supabase
      .from('patients')
      .update({ 
        next_contact_date: nextContactDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  }
}
