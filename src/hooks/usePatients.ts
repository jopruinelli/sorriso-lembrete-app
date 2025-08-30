
import { useState, useEffect } from 'react';
import { Patient, PatientCreateData } from '@/types/patient';

const STORAGE_KEY = 'dental_patients';

// Dados de exemplo para demonstração
const samplePatients: Patient[] = [
  {
    id: '1',
    name: 'Maria Silva Santos',
    phone: '(11) 99999-1234',
    secondaryPhone: '(11) 3333-5678',
    birthDate: new Date('1985-05-20'),
    lastVisit: new Date('2024-09-15'),
    nextContactReason: 'Limpeza e revisão semestral',
    nextContactDate: new Date('2025-03-15'),
    status: 'active',
    paymentType: 'particular',
    locationId: 'location-1',
    contactHistory: [
      {
        id: '1',
        date: new Date('2024-09-15'),
        method: 'in-person',
        notes: 'Consulta realizada, próxima limpeza em 6 meses',
        successful: true
      }
    ],
    created_at: new Date('2024-09-15'),
    updated_at: new Date('2024-09-15'),
    updated_by: undefined
  },
  {
    id: '2',
    name: 'João Pedro Costa',
    phone: '(11) 98888-5555',
    birthDate: new Date('1990-03-10'),
    lastVisit: new Date('2024-05-10'),
    nextContactReason: 'Continuação do tratamento de canal',
    nextContactDate: new Date('2024-12-10'),
    status: 'active',
    paymentType: 'particular',
    locationId: 'location-1',
    contactHistory: [],
    created_at: new Date('2024-05-10'),
    updated_at: new Date('2024-05-10'),
    updated_by: undefined
  },
  {
    id: '3',
    name: 'Ana Carolina Lima',
    phone: '(11) 97777-9999',
    birthDate: new Date('1988-11-30'),
    lastVisit: new Date('2024-08-20'),
    nextContactReason: 'Avaliação pós-cirurgia',
    nextContactDate: new Date('2024-11-20'),
    status: 'active',
    paymentType: 'particular',
    locationId: 'location-1',
    contactHistory: [],
    created_at: new Date('2024-08-20'),
    updated_at: new Date('2024-08-20'),
    updated_by: undefined
  }
];

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const storedPatients = localStorage.getItem(STORAGE_KEY);
    if (storedPatients) {
      const parsedPatients = JSON.parse(storedPatients);
      // Converter strings de data para objetos Date e adicionar paymentType se não existir
      const patientsWithDates = parsedPatients.map((patient: Record<string, unknown>) => ({
        ...patient,
        lastVisit: new Date(patient.lastVisit as string | number | Date),
        nextContactDate: new Date(patient.nextContactDate as string | number | Date),
        birthDate: patient.birthDate ? new Date(patient.birthDate as string | number | Date) : undefined,
        paymentType: patient.paymentType || 'particular', // Default para registros existentes
        locationId: patient.locationId || 'location-1', // Default para registros existentes
        contactHistory: (patient as any).contactHistory.map((contact: Record<string, unknown>) => ({
          ...contact,
          date: new Date(contact.date as string | number | Date)
        })),
        created_at: patient.created_at ? new Date(patient.created_at as string | number | Date) : new Date(),
        updated_at: patient.updated_at ? new Date(patient.updated_at as string | number | Date) : undefined
      }));
      console.log('📥 Pacientes carregados do localStorage:', patientsWithDates);
      setPatients(patientsWithDates);
    } else {
      // Carregar dados de exemplo na primeira vez
      console.log('🔄 Carregando dados de exemplo');
      setPatients(samplePatients);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(samplePatients));
    }
  }, []);

  const savePatients = (updatedPatients: Patient[]) => {
    console.log('💾 Salvando pacientes no localStorage:', updatedPatients.length, 'pacientes');
    console.log('📋 Lista de pacientes sendo salvos:', updatedPatients.map(p => ({ id: p.id, nome: p.name })));
    setPatients(updatedPatients);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPatients));
  };

  const addPatient = (patientData: PatientCreateData) => {
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // ID mais único
      contactHistory: [],
      created_at: new Date(),
      updated_at: undefined,
      updated_by: undefined
    };
    console.log('➕ Adicionando novo paciente:', newPatient);
    const updatedPatients = [...patients, newPatient];
    console.log('📊 Total de pacientes após adição:', updatedPatients.length);
    savePatients(updatedPatients);
  };

  const bulkAddPatients = (patientsData: PatientCreateData[]) => {
    console.log('📥 Iniciando importação em massa de', patientsData.length, 'pacientes');
    
    const newPatients: Patient[] = patientsData.map((patientData, index) => ({
      ...patientData,
      id: (Date.now() + index).toString() + Math.random().toString(36).substr(2, 9),
      contactHistory: [],
      created_at: new Date(),
      updated_at: undefined,
      updated_by: undefined
    }));
    
    console.log('✅ Pacientes criados para importação:', newPatients.map(p => ({ id: p.id, nome: p.name })));
    
    const updatedPatients = [...patients, ...newPatients];
    console.log('📊 Total de pacientes após importação em massa:', updatedPatients.length);
    
    savePatients(updatedPatients);
    
    return newPatients.length;
  };

  const updatePatient = (patientId: string, patientData: PatientCreateData) => {
    const updatedPatients = patients.map(patient =>
      patient.id === patientId
        ? { ...patient, ...patientData, updated_at: new Date() }
        : patient
    );
    console.log('✏️ Atualizando paciente:', patientId, patientData);
    savePatients(updatedPatients);
  };

  const deletePatient = (patientId: string) => {
    console.log('🗑️ Excluindo paciente:', patientId);
    const updatedPatients = patients.filter(patient => patient.id !== patientId);
    savePatients(updatedPatients);
  };

  const bulkDeletePatients = (patientIds: string[]) => {
    console.log('🗑️ Excluindo pacientes em massa:', patientIds);
    const updatedPatients = patients.filter(patient => !patientIds.includes(patient.id));
    savePatients(updatedPatients);
  };

  return {
    patients,
    addPatient,
    bulkAddPatients,
    updatePatient,
    deletePatient,
    bulkDeletePatients
  };
};
