
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
  onBulkImport: (patientsData: Omit<Patient, 'id' | 'contactHistory'>[], userId: string) => Promise<number>;
  onDeletePatient: (patientId: string) => void;
  onBulkDelete: (patientIds: string[]) => void;
  fetchLocations: () => Promise<void>;
  fetchTitles: () => Promise<void>;
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
  onBulkDelete,
  fetchLocations,
  fetchTitles
}) => {
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showPatientRemoval, setShowPatientRemoval] = useState(false);

  const isAdmin = userProfile?.role === 'admin';
  const isMobile = useIsMobile();

  const handleImport = (importedPatients: Omit<Patient, 'id' | 'contactHistory'>[]) => {
    onBulkImport(importedPatients, userProfile?.id || '');
    setShowExcelImport(false);
  };

  const handleShowPatientRemoval = () => {
    if (isAdmin) {
      setShowPatientRemoval(true);
    }
  };

  // Renderizar conteúdo específico se alguma função especial estiver ativa
  const renderSpecialContent = () => {
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

    return null;
  };

  const specialContent = renderSpecialContent();

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

        {specialContent ? (
          <div className="flex-1 overflow-auto p-6">
            {specialContent}
          </div>
        ) : (
          <Tabs defaultValue="organization" className={`w-full flex-1 ${isMobile ? 'flex flex-col' : 'flex'} overflow-hidden`}>
            <SettingsModalSidebar isAdmin={isAdmin} />
            <SettingsModalContent
              userProfile={userProfile}
              organizationSettings={organizationSettings}
              isAdmin={isAdmin}
              onUpdateProfile={onUpdateProfile}
              onUpdateSettings={onUpdateSettings}
              onShowExcelImport={() => setShowExcelImport(true)}
              onShowPatientRemoval={handleShowPatientRemoval}
              fetchLocations={fetchLocations}
              fetchTitles={fetchTitles}
            />
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
