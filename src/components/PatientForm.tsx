import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Patient, ContactPeriod, PatientCreateData } from '@/types/patient';
import { X } from 'lucide-react';
import { addMonths } from 'date-fns';
import { PatientFormFields } from './patient-form/PatientFormFields';
import { PatientFormActions } from './patient-form/PatientFormActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientAppointments } from '@/components/PatientAppointments';
import { OrganizationSettings } from '@/types/organization';

interface PatientFormProps {
  patient?: Patient;
  organizationSettings?: OrganizationSettings | null;
  onSave: (patient: PatientCreateData) => void;
  onCancel: () => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  organizationSettings,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PatientCreateData>({
    name: '',
    phone: '',
    secondaryPhone: '',
    birthDate: undefined,
    lastVisit: new Date(),
    nextContactReason: '',
    nextContactDate: new Date(),
    status: 'active' as 'active' | 'inactive' | 'closed',
    inactiveReason: '',
    paymentType: 'particular' as 'particular' | 'convenio'
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        phone: patient.phone,
        secondaryPhone: patient.secondaryPhone || '',
        birthDate: patient.birthDate,
        lastVisit: patient.lastVisit,
        nextContactReason: patient.nextContactReason,
        nextContactDate: patient.nextContactDate,
        status: patient.status,
        inactiveReason: patient.inactiveReason || '',
        paymentType: patient.paymentType
      });
    }
  }, [patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = <K extends keyof PatientCreateData>(
    field: K,
    value: PatientCreateData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePeriodChange = (period: ContactPeriod) => {
    let nextDate = new Date(formData.lastVisit);
    
    switch (period) {
      case '1month':
        nextDate = addMonths(formData.lastVisit, 1);
        break;
      case '3months':
        nextDate = addMonths(formData.lastVisit, 3);
        break;
      case '6months':
        nextDate = addMonths(formData.lastVisit, 6);
        break;
      case '1year':
        nextDate = addMonths(formData.lastVisit, 12);
        break;
      default:
        return;
    }
    
    handleChange('nextContactDate', nextDate);
  };

  const isFormValid = formData.name && formData.phone;

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent hideCloseButton className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-dental-primary flex items-center justify-between">
            <span>{patient ? 'Editar Paciente' : 'Novo Paciente'}</span>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="consultas" disabled={!patient}>Consultas</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <PatientFormFields
                formData={formData}
                onChange={handleChange}
                onPeriodChange={handlePeriodChange}
              />

              <PatientFormActions
                onCancel={onCancel}
                isEditing={!!patient}
                disabled={!isFormValid}
              />
            </form>
          </TabsContent>

          <TabsContent value="consultas">
            {patient?.id && (
              <PatientAppointments
                patientId={patient.id}
                patient={patient}
                organizationSettings={organizationSettings}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};