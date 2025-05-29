
import { useState, useEffect } from 'react';
import { Patient, ContactRecord } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';
import { convertToAppPatient } from '@/utils/patientConverters';
import { PatientService } from '@/services/patientService';
import { ContactService } from '@/services/contactService';

export const useSupabasePatients = (organizationId: string | undefined) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load patients from Supabase
  const loadPatients = async () => {
    if (!organizationId) {
      setPatients([]);
      setLoading(false);
      return;
    }

    try {
      // Load patients and contact records in parallel
      const [patientsData, contactsByPatient] = await Promise.all([
        PatientService.loadPatients(organizationId),
        ContactService.loadContactRecords(organizationId)
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
  const addPatient = async (patientData: Omit<Patient, 'id' | 'contactHistory'>, userId: string) => {
    if (!organizationId) return;

    try {
      const newPatientData = await PatientService.addPatient(patientData, userId, organizationId);
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
  const updatePatient = async (patientId: string, patientData: Omit<Patient, 'id' | 'contactHistory'>, userId: string) => {
    if (!organizationId) return;

    try {
      await PatientService.updatePatient(patientId, patientData, userId, organizationId);

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
  const addContactRecord = async (patientId: string, contactRecord: Omit<ContactRecord, 'id'>, userId: string, nextContactDate?: Date) => {
    if (!organizationId) return;

    try {
      // Add contact record
      await ContactService.addContactRecord(patientId, contactRecord, userId, organizationId);

      // Update next contact date if provided
      if (nextContactDate) {
        await PatientService.updateNextContactDate(patientId, nextContactDate, organizationId);
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
    if (!organizationId) return;

    try {
      await PatientService.deletePatient(patientId, organizationId);
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
  const bulkAddPatients = async (patientsData: Omit<Patient, 'id' | 'contactHistory'>[], userId: string) => {
    if (!organizationId) return 0;

    try {
      const importedCount = await PatientService.bulkAddPatients(patientsData, userId, organizationId);
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
    if (!organizationId) return;

    try {
      await PatientService.bulkDeletePatients(patientIds, organizationId);
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

  useEffect(() => {
    if (organizationId) {
      loadPatients();
    }
  }, [organizationId]);

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
