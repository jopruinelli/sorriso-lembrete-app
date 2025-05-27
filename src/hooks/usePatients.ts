
import { useState, useEffect } from 'react';
import { Patient, ContactRecord } from '@/types/patient';

const STORAGE_KEY = 'dental_patients';

// Dados de exemplo para demonstração
const samplePatients: Patient[] = [
  {
    id: '1',
    name: 'Maria Silva Santos',
    phone: '(11) 99999-1234',
    secondaryPhone: '(11) 3333-5678',
    lastVisit: new Date('2024-09-15'),
    nextContactReason: 'Limpeza e revisão semestral',
    nextContactDate: new Date('2025-03-15'),
    status: 'active',
    contactHistory: [
      {
        id: '1',
        date: new Date('2024-09-15'),
        method: 'in-person',
        notes: 'Consulta realizada, próxima limpeza em 6 meses',
        successful: true
      }
    ]
  },
  {
    id: '2',
    name: 'João Pedro Costa',
    phone: '(11) 98888-5555',
    lastVisit: new Date('2024-05-10'),
    nextContactReason: 'Continuação do tratamento de canal',
    nextContactDate: new Date('2024-12-10'),
    status: 'active',
    contactHistory: []
  },
  {
    id: '3',
    name: 'Ana Carolina Lima',
    phone: '(11) 97777-9999',
    lastVisit: new Date('2024-08-20'),
    nextContactReason: 'Avaliação pós-cirurgia',
    nextContactDate: new Date('2024-11-20'),
    status: 'active',
    contactHistory: []
  }
];

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const storedPatients = localStorage.getItem(STORAGE_KEY);
    if (storedPatients) {
      const parsedPatients = JSON.parse(storedPatients);
      // Converter strings de data para objetos Date
      const patientsWithDates = parsedPatients.map((patient: any) => ({
        ...patient,
        lastVisit: new Date(patient.lastVisit),
        nextContactDate: new Date(patient.nextContactDate),
        contactHistory: patient.contactHistory.map((contact: any) => ({
          ...contact,
          date: new Date(contact.date)
        }))
      }));
      setPatients(patientsWithDates);
    } else {
      // Carregar dados de exemplo na primeira vez
      setPatients(samplePatients);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(samplePatients));
    }
  }, []);

  const savePatients = (updatedPatients: Patient[]) => {
    setPatients(updatedPatients);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPatients));
  };

  const addPatient = (patientData: Omit<Patient, 'id' | 'contactHistory'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString(),
      contactHistory: []
    };
    const updatedPatients = [...patients, newPatient];
    savePatients(updatedPatients);
  };

  const updatePatient = (patientId: string, patientData: Omit<Patient, 'id' | 'contactHistory'>) => {
    const updatedPatients = patients.map(patient =>
      patient.id === patientId
        ? { ...patient, ...patientData }
        : patient
    );
    savePatients(updatedPatients);
  };

  const addContactRecord = (patientId: string, contactRecord: Omit<ContactRecord, 'id'>, nextContactDate?: Date) => {
    const updatedPatients = patients.map(patient => {
      if (patient.id === patientId) {
        const newContactRecord: ContactRecord = {
          ...contactRecord,
          id: Date.now().toString()
        };
        return {
          ...patient,
          contactHistory: [newContactRecord, ...patient.contactHistory],
          ...(nextContactDate && { nextContactDate })
        };
      }
      return patient;
    });
    savePatients(updatedPatients);
  };

  const deletePatient = (patientId: string) => {
    const updatedPatients = patients.filter(patient => patient.id !== patientId);
    savePatients(updatedPatients);
  };

  return {
    patients,
    addPatient,
    updatePatient,
    addContactRecord,
    deletePatient
  };
};
