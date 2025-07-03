
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-dental-primary">Configurações</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="organization" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
            <TabsTrigger value="organization" className="text-xs px-2 py-1.5">
              <Building2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">Organização</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs px-2 py-1.5">
              <User className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs px-2 py-1.5">
              <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="text-xs px-2 py-1.5">
              <FileSpreadsheet className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">Importar</span>
            </TabsTrigger>
            <TabsTrigger value="removal" className="text-xs px-2 py-1.5">
              <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">Remover</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="text-xs px-2 py-1.5">
                <Users className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Usuários</span>
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
