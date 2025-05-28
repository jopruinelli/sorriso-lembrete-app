
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Patient, ContactRecord } from '@/types/patient';
import { DatabasePatient, DatabaseContactRecord } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';

export const useSupabasePatients = (userId: string | undefined) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Convert database format to app format
  const convertToAppPatient = (dbPatient: DatabasePatient, contactHistory: ContactRecord[] = []): Patient => ({
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
  const convertToDbPatient = (appPatient: Omit<Patient, 'id' | 'contactHistory'>, userId: string): Omit<DatabasePatient, 'id' | 'created_at' | 'updated_at'> => ({
    user_id: userId,
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

  // Load patients from Supabase
  const loadPatients = async () => {
    if (!userId) {
      setPatients([]);
      setLoading(false);
      return;
    }

    try {
      // Load patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .order('next_contact_date', { ascending: true });

      if (patientsError) throw patientsError;

      // Load contact records for all patients
      const { data: contactsData, error: contactsError } = await supabase
        .from('contact_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (contactsError) throw contactsError;

      // Group contacts by patient
      const contactsByPatient: Record<string, ContactRecord[]> = {};
      contactsData?.forEach(contact => {
        if (!contactsByPatient[contact.patient_id]) {
          contactsByPatient[contact.patient_id] = [];
        }
        contactsByPatient[contact.patient_id].push({
          id: contact.id,
          date: new Date(contact.date),
          method: contact.method as ContactRecord['method'],
          notes: contact.notes || '',
          successful: contact.successful
        });
      });

      // Convert and combine data with proper type assertion
      const convertedPatients = patientsData?.map(patient => {
        // Type assertion to ensure compatibility with DatabasePatient interface
        const typedPatient: DatabasePatient = {
          ...patient,
          status: patient.status as 'active' | 'inactive',
          payment_type: patient.payment_type as 'particular' | 'convenio'
        };
        return convertToAppPatient(typedPatient, contactsByPatient[patient.id] || []);
      }) || [];

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
      const dbPatient = convertToDbPatient(patientData, userId);
      const { data, error } = await supabase
        .from('patients')
        .insert([dbPatient])
        .select()
        .single();

      if (error) throw error;

      // Type assertion for the returned data
      const typedData: DatabasePatient = {
        ...data,
        status: data.status as 'active' | 'inactive',
        payment_type: data.payment_type as 'particular' | 'convenio'
      };

      const newPatient = convertToAppPatient(typedData, []);
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
      const dbPatient = convertToDbPatient(patientData, userId);
      const { error } = await supabase
        .from('patients')
        .update({ ...dbPatient, updated_at: new Date().toISOString() })
        .eq('id', patientId)
        .eq('user_id', userId);

      if (error) throw error;

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
      const { error: contactError } = await supabase
        .from('contact_records')
        .insert([{
          patient_id: patientId,
          user_id: userId,
          date: contactRecord.date.toISOString(),
          method: contactRecord.method,
          notes: contactRecord.notes,
          successful: contactRecord.successful
        }]);

      if (contactError) throw contactError;

      // Update next contact date if provided
      if (nextContactDate) {
        const { error: updateError } = await supabase
          .from('patients')
          .update({ 
            next_contact_date: nextContactDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', patientId)
          .eq('user_id', userId);

        if (updateError) throw updateError;
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
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('user_id', userId);

      if (error) throw error;

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
      const dbPatients = patientsData.map(patient => convertToDbPatient(patient, userId));
      const { data, error } = await supabase
        .from('patients')
        .insert(dbPatients)
        .select();

      if (error) throw error;

      await loadPatients();
      return data.length;
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
      const { error } = await supabase
        .from('patients')
        .delete()
        .in('id', patientIds)
        .eq('user_id', userId);

      if (error) throw error;

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
      const localData = localStorage.getItem('dental_patients');
      if (!localData) return;

      const localPatients = JSON.parse(localData);
      console.log('🔄 Migrando dados do localStorage para Supabase...');
      
      const importedCount = await bulkAddPatients(localPatients.map((p: any) => ({
        ...p,
        lastVisit: new Date(p.lastVisit),
        nextContactDate: new Date(p.nextContactDate),
        paymentType: p.paymentType || 'particular'
      })));

      if (importedCount > 0) {
        localStorage.removeItem('dental_patients');
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
