import { useState, useEffect } from 'react';
import { Patient, PatientCreateData } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';
import { convertToAppPatient } from '@/utils/patientConverters';
import { PatientService } from '@/services/patientService';
import { ContactService } from '@/services/contactService';

export const useSupabasePatients = (organizationId: string | undefined) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  // Load patients from Supabase
  const loadPatients = async () => {
    if (!organizationId) {
      console.log('ℹ️ No organizationId provided, clearing patients');
      setPatients([]);
      setHasError(false);
      setLoading(false);
      return;
    }

    try {
      console.log('📥 Loading patients for organization:', organizationId);
      setHasError(false);
      
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
      console.log('✅ Patients loaded successfully:', convertedPatients.length);
    } catch (error) {
      console.error('❌ Error loading patients:', error);
      setHasError(true);
      
      // Não mostrar toast se for erro de RLS/policy (esperado para usuários sem organização)
      const errorMessage = error?.message?.toLowerCase() || '';
      const isRLSError = errorMessage.includes('policy') || 
                        errorMessage.includes('row-level security') ||
                        errorMessage.includes('permission');
      
      if (!isRLSError) {
        toast({
          title: "Erro ao carregar dados",
          description: "Falha ao carregar pacientes do servidor",
          variant: "destructive",
        });
      } else {
        console.log('🔧 RLS/Permission error detected, failing silently');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add patient to Supabase
  const addPatient = async (
    patientData: PatientCreateData,
    userId: string
  ): Promise<Patient | void> => {
    console.log('🚀 Starting addPatient:', { patientName: patientData.name, userId, organizationId });
    
    if (!organizationId) {
      console.error('❌ No organizationId available');
      toast({
        title: "Erro",
        description: "Você precisa estar vinculado a uma organização para adicionar pacientes",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      console.error('❌ No userId available');
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📝 Calling PatientService.addPatient...');
      const newPatientData = await PatientService.addPatient(patientData, userId, organizationId);
      const newPatient = convertToAppPatient(newPatientData, []);
      
      setPatients(prev => [...prev, newPatient]);
      
      toast({
        title: "Paciente adicionado",
        description: `Paciente ${patientData.name} salvo com segurança na organização`,
      });
      
      console.log('✅ Patient added successfully to state');
      return newPatient;
    } catch (error) {
      console.error('❌ Error adding patient:', error);
      
      // Mensagem de erro mais específica baseada no tipo de erro
      let errorMessage = "Falha ao salvar paciente no servidor";
      const errorString = error?.message?.toLowerCase() || '';
      
      if (errorString.includes('policy') || errorString.includes('row-level security')) {
        errorMessage = "Você não tem permissão para adicionar pacientes nesta organização";
      } else if (errorString.includes('organization_id')) {
        errorMessage = "Erro de configuração da organização. Tente fazer logout e login novamente";
      } else if (errorString.includes('não pertence')) {
        errorMessage = "Sua conta não está vinculada a uma organização válida";
      }
      
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Update patient in Supabase
  const updatePatient = async (patientId: string, patientData: PatientCreateData, userId: string) => {
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
      console.error('❌ Error updating patient:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Falha ao atualizar dados no servidor",
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
      console.error('❌ Error deleting patient:', error);
      toast({
        title: "Erro ao excluir",
        description: "Falha ao excluir paciente do servidor",
        variant: "destructive",
      });
    }
  };

  // Bulk operations
  const bulkAddPatients = async (patientsData: PatientCreateData[], userId: string) => {
    if (!organizationId) return 0;

    try {
      const importedCount = await PatientService.bulkAddPatients(patientsData, userId, organizationId);
      await loadPatients();
      return importedCount;
    } catch (error) {
      console.error('❌ Error in bulk import:', error);
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
      console.error('❌ Error in bulk delete:', error);
      toast({
        title: "Erro na exclusão",
        description: "Falha ao excluir pacientes",
        variant: "destructive",
      });
    }
  };

  const retryLoadPatients = () => {
    setLoading(true);
    setHasError(false);
    loadPatients();
  };

  useEffect(() => {
    console.log('🔄 useSupabasePatients effect, organizationId:', organizationId);
    if (organizationId) {
      loadPatients();
    } else {
      // Se não tem organizationId, limpar dados imediatamente
      setPatients([]);
      setLoading(false);
      setHasError(false);
    }
  }, [organizationId]);

  return {
    patients,
    loading,
    hasError,
    addPatient,
    updatePatient,
    deletePatient,
    bulkAddPatients,
    bulkDeletePatients,
    retryLoadPatients
  };
};
