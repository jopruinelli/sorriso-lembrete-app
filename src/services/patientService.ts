
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/patient';
import { DatabasePatient } from '@/types/supabase';
import { convertToDbPatient, assertDatabasePatient } from '@/utils/patientConverters';

export class PatientService {
  static async loadPatients(userId: string) {
    const { data: patientsData, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .order('next_contact_date', { ascending: true });

    if (error) throw error;

    return patientsData?.map(patient => assertDatabasePatient(patient)) || [];
  }

  static async addPatient(patientData: Omit<Patient, 'id' | 'contactHistory'>, userId: string) {
    const dbPatient = convertToDbPatient(patientData, userId);
    const { data, error } = await supabase
      .from('patients')
      .insert([dbPatient])
      .select()
      .single();

    if (error) throw error;

    return assertDatabasePatient(data);
  }

  static async updatePatient(patientId: string, patientData: Omit<Patient, 'id' | 'contactHistory'>, userId: string) {
    const dbPatient = convertToDbPatient(patientData, userId);
    const { error } = await supabase
      .from('patients')
      .update({ ...dbPatient, updated_at: new Date().toISOString() })
      .eq('id', patientId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async deletePatient(patientId: string, userId: string) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async bulkAddPatients(patientsData: Omit<Patient, 'id' | 'contactHistory'>[], userId: string) {
    const dbPatients = patientsData.map(patient => convertToDbPatient(patient, userId));
    const { data, error } = await supabase
      .from('patients')
      .insert(dbPatients)
      .select();

    if (error) throw error;

    return data?.length || 0;
  }

  static async bulkDeletePatients(patientIds: string[], userId: string) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .in('id', patientIds)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async updateNextContactDate(patientId: string, nextContactDate: Date, userId: string) {
    const { error } = await supabase
      .from('patients')
      .update({ 
        next_contact_date: nextContactDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
