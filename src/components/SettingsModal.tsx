
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExcelImport } from '@/components/ExcelImport';
import { PatientRemoval } from '@/components/PatientRemoval';
import { UserManagement } from '@/components/UserManagement';
import { OrganizationTab } from '@/components/settings/OrganizationTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { WhatsAppTab } from '@/components/settings/WhatsAppTab';
import { ImportTab } from '@/components/settings/ImportTab';
import { RemovalTab } from '@/components/settings/RemovalTab';
import { UserProfile, OrganizationSettings } from '@/types/organization';
import { Patient } from '@/types/patient';
import { Building2, User, MessageSquare, FileSpreadsheet, Trash2, Users } from 'lucide-react';

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
  const tabsCount = isAdmin ? 6 : 5;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-dental-primary">Configurações</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="organization" className="w-full">
          <TabsList className={`grid w-full grid-cols-${tabsCount}`}>
            <TabsTrigger value="organization" className="text-xs">
              <Building2 className="w-4 h-4 mr-1" />
              Organização
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs">
              <User className="w-4 h-4 mr-1" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs">
              <MessageSquare className="w-4 h-4 mr-1" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="import" className="text-xs">
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="removal" className="text-xs">
              <Trash2 className="w-4 h-4 mr-1" />
              Remover
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="text-xs">
                <Users className="w-4 h-4 mr-1" />
                Usuários
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="organization" className="space-y-4">
            <OrganizationTab userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <ProfileTab 
              userProfile={userProfile}
              onUpdateProfile={onUpdateProfile}
            />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <WhatsAppTab
              userProfile={userProfile}
              organizationSettings={organizationSettings}
              onUpdateSettings={onUpdateSettings}
            />
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <ImportTab onShowExcelImport={() => setShowExcelImport(true)} />
          </TabsContent>

          <TabsContent value="removal" className="space-y-4">
            <RemovalTab onShowPatientRemoval={() => setShowPatientRemoval(true)} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="space-y-4">
              <UserManagement 
                organizationId={userProfile?.organization_id || ''}
                currentUserId={userProfile?.user_id || ''}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
