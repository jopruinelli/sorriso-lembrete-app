
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

        <Tabs defaultValue="organization" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className={`
            ${isMobile 
              ? 'grid grid-cols-3 gap-1 mb-4 h-auto p-1' 
              : 'grid grid-cols-3 md:grid-cols-5 gap-1 mb-6'
            }
            w-full flex-shrink-0
          `}>
            <TabsTrigger 
              value="organization" 
              className={`
                ${isMobile 
                  ? 'flex flex-col items-center justify-center p-2 h-auto text-xs' 
                  : 'flex items-center px-3 py-2 text-sm'
                }
              `}
            >
              <Building2 className={isMobile ? "w-4 h-4 mb-1" : "w-4 h-4 mr-2"} />
              <span className={isMobile ? "text-xs leading-tight" : ""}>
                {isMobile ? "Org." : "Organização"}
              </span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="profile" 
              className={`
                ${isMobile 
                  ? 'flex flex-col items-center justify-center p-2 h-auto text-xs' 
                  : 'flex items-center px-3 py-2 text-sm'
                }
              `}
            >
              <User className={isMobile ? "w-4 h-4 mb-1" : "w-4 h-4 mr-2"} />
              <span className={isMobile ? "text-xs leading-tight" : ""}>Perfil</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="whatsapp" 
              className={`
                ${isMobile 
                  ? 'flex flex-col items-center justify-center p-2 h-auto text-xs' 
                  : 'flex items-center px-3 py-2 text-sm'
                }
              `}
            >
              <MessageSquare className={isMobile ? "w-4 h-4 mb-1" : "w-4 h-4 mr-2"} />
              <span className={isMobile ? "text-xs leading-tight" : ""}>
                {isMobile ? "Zap" : "WhatsApp"}
              </span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="import" 
              className={`
                ${isMobile 
                  ? 'flex flex-col items-center justify-center p-2 h-auto text-xs' 
                  : 'flex items-center px-3 py-2 text-sm'
                }
              `}
            >
              <FileSpreadsheet className={isMobile ? "w-4 h-4 mb-1" : "w-4 h-4 mr-2"} />
              <span className={isMobile ? "text-xs leading-tight" : ""}>
                {isMobile ? "Import" : "Importar"}
              </span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="removal" 
              className={`
                ${isMobile 
                  ? 'flex flex-col items-center justify-center p-2 h-auto text-xs' 
                  : 'flex items-center px-3 py-2 text-sm'
                }
              `}
            >
              <Trash2 className={isMobile ? "w-4 h-4 mb-1" : "w-4 h-4 mr-2"} />
              <span className={isMobile ? "text-xs leading-tight" : ""}>
                {isMobile ? "Remove" : "Remover"}
              </span>
            </TabsTrigger>
            
            {isAdmin && (
              <TabsTrigger 
                value="users" 
                className={`
                  ${isMobile 
                    ? 'flex flex-col items-center justify-center p-2 h-auto text-xs col-span-3' 
                    : 'flex items-center px-3 py-2 text-sm'
                  }
                `}
              >
                <Users className={isMobile ? "w-4 h-4 mb-1" : "w-4 h-4 mr-2"} />
                <span className={isMobile ? "text-xs leading-tight" : ""}>Usuários</span>
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="organization" className="space-y-4 mt-0">
              <OrganizationTab userProfile={userProfile} />
            </TabsContent>

            <TabsContent value="profile" className="space-y-4 mt-0">
              <ProfileTab 
                userProfile={userProfile}
                onUpdateProfile={onUpdateProfile}
              />
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 mt-0">
              <WhatsAppTab
                userProfile={userProfile}
                organizationSettings={organizationSettings}
                onUpdateSettings={onUpdateSettings}
              />
            </TabsContent>

            <TabsContent value="import" className="space-y-4 mt-0">
              <ImportTab onShowExcelImport={() => setShowExcelImport(true)} />
            </TabsContent>

            <TabsContent value="removal" className="space-y-4 mt-0">
              <RemovalTab onShowPatientRemoval={() => setShowPatientRemoval(true)} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="users" className="space-y-4 mt-0">
                <UserManagement 
                  organizationId={userProfile?.organization_id || ''}
                  currentUserId={userProfile?.user_id || ''}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
