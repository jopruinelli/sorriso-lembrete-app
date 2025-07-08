
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs } from '@/components/ui/tabs';
import { ExcelImport } from '@/components/ExcelImport';
import { PatientRemoval } from '@/components/PatientRemoval';
import { SettingsModalSidebar } from '@/components/settings/SettingsModalSidebar';
import { SettingsModalContent } from '@/components/settings/SettingsModalContent';
import { UserProfile, OrganizationSettings } from '@/types/organization';
import { Patient } from '@/types/patient';
import { useIsMobile } from '@/hooks/use-mobile';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  organizationSettings: OrganizationSettings | null;
  patients: Patient[];
  onUpdateProfile: (updates: { name: string }) => void;
  onUpdateSettings: (updates: { whatsapp_default_message: string }) => void;
  onBulkImport: (patients: Omit<Patient, 'id' | 'contactHistory'>[]) => void;
  onDeletePatient: (patientId: string) => void;
  onBulkDelete: (patientIds: string[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  organizationSettings,
  patients,
  onUpdateProfile,
  onUpdateSettings,
  onBulkImport,
  onDeletePatient,
  onBulkDelete
}) => {
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showPatientRemoval, setShowPatientRemoval] = useState(false);

  const handleImport = (importedPatients: Omit<Patient, 'id' | 'contactHistory'>[]) => {
    onBulkImport(importedPatients);
    setShowExcelImport(false);
  };

  if (showExcelImport) {
    return (
      <ExcelImport
        onImport={handleImport}
        onCancel={() => setShowExcelImport(false)}
      />
    );
  }

  if (showPatientRemoval) {
    return (
      <PatientRemoval
        patients={patients}
        onDeletePatient={onDeletePatient}
        onBulkDelete={onBulkDelete}
        onClose={() => setShowPatientRemoval(false)}
      />
    );
  }

  const isAdmin = userProfile?.role === 'admin';
  const isMobile = useIsMobile();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`
        ${isMobile 
          ? 'w-[95vw] max-w-none h-[90vh] max-h-none p-4' 
          : 'max-w-4xl max-h-[85vh] w-[90vw]'
        } 
        overflow-hidden flex flex-col
      `}>
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-dental-primary text-lg md:text-xl">
            Configurações
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="organization" className="w-full flex-1 flex overflow-hidden">
          <SettingsModalSidebar isAdmin={isAdmin} />
          <SettingsModalContent
            userProfile={userProfile}
            organizationSettings={organizationSettings}
            isAdmin={isAdmin}
            onUpdateProfile={onUpdateProfile}
            onUpdateSettings={onUpdateSettings}
            onShowExcelImport={() => setShowExcelImport(true)}
            onShowPatientRemoval={() => setShowPatientRemoval(true)}
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
