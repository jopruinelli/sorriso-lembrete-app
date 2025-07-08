
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

        <Tabs defaultValue="organization" className="w-full flex-1 flex overflow-hidden">
          <div className={`
            ${isMobile 
              ? 'flex flex-row overflow-x-auto pb-2 mb-4 border-b' 
              : 'flex flex-col w-16 hover:w-48 transition-all duration-300 ease-in-out border-r bg-muted/30 group'
            }
            flex-shrink-0
          `}>
            <TabsList className={`
              ${isMobile 
                ? 'flex flex-row gap-1 p-1 bg-transparent min-w-max' 
                : 'flex flex-col h-full w-full bg-transparent p-1 gap-1'
              }
            `}>
              <TabsTrigger 
                value="organization" 
                className={`
                  ${isMobile 
                    ? 'flex flex-col items-center justify-center p-3 h-auto text-xs min-w-[60px]' 
                    : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
                  }
                `}
                title="Organização"
              >
                <Building2 className={isMobile ? "w-5 h-5 mb-1" : "w-5 h-5 flex-shrink-0"} />
                {isMobile ? (
                  <span className="text-xs leading-tight">Org.</span>
                ) : (
                  <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Organização
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger 
                value="profile" 
                className={`
                  ${isMobile 
                    ? 'flex flex-col items-center justify-center p-3 h-auto text-xs min-w-[60px]' 
                    : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
                  }
                `}
                title="Perfil"
              >
                <User className={isMobile ? "w-5 h-5 mb-1" : "w-5 h-5 flex-shrink-0"} />
                {isMobile ? (
                  <span className="text-xs leading-tight">Perfil</span>
                ) : (
                  <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Perfil
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger 
                value="whatsapp" 
                className={`
                  ${isMobile 
                    ? 'flex flex-col items-center justify-center p-3 h-auto text-xs min-w-[60px]' 
                    : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
                  }
                `}
                title="WhatsApp"
              >
                <MessageSquare className={isMobile ? "w-5 h-5 mb-1" : "w-5 h-5 flex-shrink-0"} />
                {isMobile ? (
                  <span className="text-xs leading-tight">Zap</span>
                ) : (
                  <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    WhatsApp
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger 
                value="import" 
                className={`
                  ${isMobile 
                    ? 'flex flex-col items-center justify-center p-3 h-auto text-xs min-w-[60px]' 
                    : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
                  }
                `}
                title="Importar"
              >
                <FileSpreadsheet className={isMobile ? "w-5 h-5 mb-1" : "w-5 h-5 flex-shrink-0"} />
                {isMobile ? (
                  <span className="text-xs leading-tight">Import</span>
                ) : (
                  <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Importar
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger 
                value="removal" 
                className={`
                  ${isMobile 
                    ? 'flex flex-col items-center justify-center p-3 h-auto text-xs min-w-[60px]' 
                    : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
                  }
                `}
                title="Remover"
              >
                <Trash2 className={isMobile ? "w-5 h-5 mb-1" : "w-5 h-5 flex-shrink-0"} />
                {isMobile ? (
                  <span className="text-xs leading-tight">Remove</span>
                ) : (
                  <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Remover
                  </span>
                )}
              </TabsTrigger>
              
              {isAdmin && (
                <TabsTrigger 
                  value="users" 
                  className={`
                    ${isMobile 
                      ? 'flex flex-col items-center justify-center p-3 h-auto text-xs min-w-[60px]' 
                      : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
                    }
                  `}
                  title="Usuários"
                >
                  <Users className={isMobile ? "w-5 h-5 mb-1" : "w-5 h-5 flex-shrink-0"} />
                  {isMobile ? (
                    <span className="text-xs leading-tight">Users</span>
                  ) : (
                    <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Usuários
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
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
