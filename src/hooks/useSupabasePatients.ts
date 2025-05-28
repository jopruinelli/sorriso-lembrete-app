
import { useState, useEffect } from 'react';
import { Patient, ContactRecord } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';
import { convertToAppPatient } from '@/utils/patientConverters';
import { PatientService } from '@/services/patientService';
import { ContactService } from '@/services/contactService';
import { getMigrationData, clearMigrationData } from '@/utils/migrationUtils';

export const useSupabasePatients = (userId: string | undefined) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load patients from Supabase
  const loadPatients = async () => {
    if (!userId) {
      setPatients([]);
      setLoading(false);
      return;
    }

    try {
      // Load patients and contact records in parallel
      const [patientsData, contactsByPatient] = await Promise.all([
        PatientService.loadPatients(userId),
        ContactService.loadContactRecords(userId)
      ]);

      // Convert and combine data
      const convertedPatients = patientsData.map(patient => 
        convertToAppPatient(patient, contactsByPatient[patient.id] || [])
      );

      setPatients(convertedPatients);
      console.log('📥 Pacientes carregados do Supabase:', convertedPatients.length);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Falha ao carregar pacientes do servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add patient to Supabase
  const addPatient = async (patientData: Omit<Patient, 'id' | 'contactHistory'>) => {
    if (!userId) return;

    try {
      const newPatientData = await PatientService.addPatient(patientData, userId);
      const newPatient = convertToAppPatient(newPatientData, []);
      
      setPatients(prev => [...prev, newPatient]);
      
      toast({
        title: "Paciente adicionado",
        description: "Paciente salvo com segurança no servidor",
      });
    } catch (error) {
      console.error('Erro ao adicionar paciente:', error);
      toast({
        title: "Erro ao salvar",
        description: "Falha ao salvar paciente no servidor",
        variant: "destructive",
      });
    }
  };

  // Update patient in Supabase
  const updatePatient = async (patientId: string, patientData: Omit<Patient, 'id' | 'contactHistory'>) => {
    if (!userId) return;

    try {
      await PatientService.updatePatient(patientId, patientData, userId);

      setPatients(prev => prev.map(patient =>
        patient.id === patientId
          ? { ...patient, ...patientData }
          : patient
      ));

      toast({
        title: "Paciente atualizado",
        description: "Dados atualizados com segurança",
      });
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Falha ao atualizar dados no servidor",
        variant: "destructive",
      });
    }
  };

  // Add contact record
  const addContactRecord = async (patientId: string, contactRecord: Omit<ContactRecord, 'id'>, nextContactDate?: Date) => {
    if (!userId) return;

    try {
      // Add contact record
      await ContactService.addContactRecord(patientId, contactRecord, userId);

      // Update next contact date if provided
      if (nextContactDate) {
        await PatientService.updateNextContactDate(patientId, nextContactDate, userId);
      }

      // Reload patients to get updated data
      await loadPatients();

      toast({
        title: "Contato registrado",
        description: "Contato salvo com segurança no servidor",
      });
    } catch (error) {
      console.error('Erro ao registrar contato:', error);
      toast({
        title: "Erro ao registrar",
        description: "Falha ao registrar contato no servidor",
        variant: "destructive",
      });
    }
  };

  // Delete patient
  const deletePatient = async (patientId: string) => {
    if (!userId) return;

    try {
      await PatientService.deletePatient(patientId, userId);
      setPatients(prev => prev.filter(patient => patient.id !== patientId));
      
      toast({
        title: "Paciente excluído",
        description: "Paciente removido com segurança",
      });
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast({
        title: "Erro ao excluir",
        description: "Falha ao excluir paciente do servidor",
        variant: "destructive",
      });
    }
  };

  // Bulk operations
  const bulkAddPatients = async (patientsData: Omit<Patient, 'id' | 'contactHistory'>[]) => {
    if (!userId) return 0;

    try {
      const importedCount = await PatientService.bulkAddPatients(patientsData, userId);
      await loadPatients();
      return importedCount;
    } catch (error) {
      console.error('Erro na importação em massa:', error);
      toast({
        title: "Erro na importação",
        description: "Falha ao importar pacientes",
        variant: "destructive",
      });
      return 0;
    }
  };

  const bulkDeletePatients = async (patientIds: string[]) => {
    if (!userId) return;

    try {
      await PatientService.bulkDeletePatients(patientIds, userId);
      setPatients(prev => prev.filter(patient => !patientIds.includes(patient.id)));
      
      toast({
        title: "Pacientes excluídos",
        description: "Pacientes removidos com segurança",
      });
    } catch (error) {
      console.error('Erro na exclusão em massa:', error);
      toast({
        title: "Erro na exclusão",
        description: "Falha ao excluir pacientes",
        variant: "destructive",
      });
    }
  };

  // Migrate from localStorage
  const migrateFromLocalStorage = async () => {
    if (!userId) return;

    try {
      const localPatients = getMigrationData();
      if (localPatients.length === 0) return;

      console.log('🔄 Migrando dados do localStorage para Supabase...');
      
      const importedCount = await bulkAddPatients(localPatients);

      if (importedCount > 0) {
        clearMigrationData();
        toast({
          title: "Migração concluída",
          description: `${importedCount} pacientes migrados para o servidor seguro`,
        });
      }
    } catch (error) {
      console.error('Erro na migração:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadPatients();
      // Try to migrate from localStorage on first load
      setTimeout(migrateFromLocalStorage, 1000);
    }
  }, [userId]);

  return {
    patients,
    loading,
    addPatient,
    updatePatient,
    addContactRecord,
    deletePatient,
    bulkAddPatients,
    bulkDeletePatients
  };
};
