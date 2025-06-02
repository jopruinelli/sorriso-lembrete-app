
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/patient';
import { DatabasePatient } from '@/types/supabase';
import { convertToDbPatient, assertDatabasePatient } from '@/utils/patientConverters';

export class PatientService {
  static async loadPatients(organizationId: string): Promise<DatabasePatient[]> {
    console.log('📥 PatientService.loadPatients:', organizationId);
    
    if (!organizationId) {
      console.log('⚠️ No organizationId provided');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('organization_id', organizationId)
        .order('next_contact_date', { ascending: true });

      if (error) {
        console.error('❌ Error loading patients:', error);
        throw error;
      }

      console.log('✅ Patients loaded:', data?.length || 0);
      return data?.map(patient => assertDatabasePatient(patient)) || [];
    } catch (error) {
      console.error('❌ PatientService.loadPatients failed:', error);
      throw error;
    }
  }

  static async addPatient(patientData: Omit<Patient, 'id' | 'contactHistory'>, userId: string, organizationId: string): Promise<DatabasePatient> {
    console.log('➕ PatientService.addPatient:', { patientData: patientData.name, userId, organizationId });
    
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    try {
      const dbPatient = convertToDbPatient(patientData, userId, organizationId);
      
      const { data, error } = await supabase
        .from('patients')
        .insert([dbPatient])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding patient:', error);
        throw error;
      }

      console.log('✅ Patient added:', data);
      return assertDatabasePatient(data);
    } catch (error) {
      console.error('❌ PatientService.addPatient failed:', error);
      throw error;
    }
  }

  static async updatePatient(patientId: string, patientData: Omit<Patient, 'id' | 'contactHistory'>, userId: string, organizationId: string): Promise<void> {
    console.log('📝 PatientService.updatePatient:', { patientId, organizationId });
    
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    try {
      const dbPatient = convertToDbPatient(patientData, userId, organizationId);
      
      const { error } = await supabase
        .from('patients')
        .update({ ...dbPatient, updated_at: new Date().toISOString() })
        .eq('id', patientId)
        .eq('organization_id', organizationId)
        .select();

      if (error) {
        console.error('❌ Error updating patient:', error);
        throw error;
      }

      console.log('✅ Patient updated');
    } catch (error) {
      console.error('❌ PatientService.updatePatient failed:', error);
      throw error;
    }
  }

  static async deletePatient(patientId: string, organizationId: string): Promise<void> {
    console.log('🗑️ PatientService.deletePatient:', { patientId, organizationId });
    
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('❌ Error deleting patient:', error);
        throw error;
      }

      console.log('✅ Patient deleted');
    } catch (error) {
      console.error('❌ PatientService.deletePatient failed:', error);
      throw error;
    }
  }

  static async bulkAddPatients(patientsData: Omit<Patient, 'id' | 'contactHistory'>[], userId: string, organizationId: string): Promise<number> {
    console.log('📦 PatientService.bulkAddPatients:', { count: patientsData.length, userId, organizationId });
    
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    try {
      const dbPatients = patientsData.map(patient => convertToDbPatient(patient, userId, organizationId));
      
      const { data, error } = await supabase
        .from('patients')
        .insert(dbPatients)
        .select();

      if (error) {
        console.error('❌ Error bulk adding patients:', error);
        throw error;
      }

      console.log('✅ Bulk patients added:', data?.length || 0);
      return data?.length || 0;
    } catch (error) {
      console.error('❌ PatientService.bulkAddPatients failed:', error);
      throw error;
    }
  }

  static async bulkDeletePatients(patientIds: string[], organizationId: string): Promise<void> {
    console.log('🗑️ PatientService.bulkDeletePatients:', { count: patientIds.length, organizationId });
    
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .in('id', patientIds)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('❌ Error bulk deleting patients:', error);
        throw error;
      }

      console.log('✅ Bulk patients deleted');
    } catch (error) {
      console.error('❌ PatientService.bulkDeletePatients failed:', error);
      throw error;
    }
  }

  static async updateNextContactDate(patientId: string, nextContactDate: Date, organizationId: string): Promise<void> {
    console.log('📅 PatientService.updateNextContactDate:', { patientId, nextContactDate, organizationId });
    
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    try {
      const { error } = await supabase
        .from('patients')
        .update({ 
          next_contact_date: nextContactDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId)
        .eq('organization_id', organizationId)
        .select();

      if (error) {
        console.error('❌ Error updating next contact date:', error);
        throw error;
      }

      console.log('✅ Next contact date updated');
    } catch (error) {
      console.error('❌ PatientService.updateNextContactDate failed:', error);
      throw error;
    }
  }
}
