
import { Patient } from '@/types/patient';

export const getMigrationData = (): Omit<Patient, 'id' | 'contactHistory'>[] => {
  const localData = localStorage.getItem('dental_patients');
  if (!localData) return [];

  const localPatients = JSON.parse(localData);
  return localPatients.map((p: any) => ({
    ...p,
    lastVisit: new Date(p.lastVisit),
    nextContactDate: new Date(p.nextContactDate),
    paymentType: p.paymentType || 'particular'
  }));
};

export const clearMigrationData = () => {
  localStorage.removeItem('dental_patients');
};
