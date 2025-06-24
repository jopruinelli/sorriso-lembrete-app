import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExcelImport } from '@/components/ExcelImport';
import { PatientRemoval } from '@/components/PatientRemoval';
import { UserManagement } from '@/components/UserManagement';
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
  const [userName, setUserName] = useState(userProfile?.name || '');
  const [whatsappMessage, setWhatsappMessage] = useState(
    organizationSettings?.whatsapp_default_message || ''
  );
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showPatientRemoval, setShowPatientRemoval] = useState(false);

  React.useEffect(() => {
    setUserName(userProfile?.name || '');
    setWhatsappMessage(organizationSettings?.whatsapp_default_message || '');
  }, [userProfile, organizationSettings]);

  const handleSaveProfile = () => {
    onUpdateProfile({ name: userName });
  };

  const handleSaveWhatsappMessage = () => {
    onUpdateSettings({ whatsapp_default_message: whatsappMessage });
  };

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
            <Card>
              <CardHeader>
                <CardTitle className="text-dental-primary">Informações da Organização</CardTitle>
                <CardDescription>
                  Detalhes sobre sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nome da Organização</Label>
                  <Input 
                    value={(userProfile as any)?.organizations?.name || ''} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Tipo de Conta</Label>
                  <div className="mt-2">
                    <Badge variant={userProfile?.role === 'admin' ? 'default' : 'secondary'}>
                      {userProfile?.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </Badge>
                  </div>
                </div>
                {userProfile?.role === 'admin' && (
                  <p className="text-sm text-dental-secondary">
                    Como administrador, você tem acesso a todas as configurações da organização.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-dental-primary">Perfil do Usuário</CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="userName">Nome</Label>
                  <Input
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  className="bg-dental-primary hover:bg-dental-secondary"
                  disabled={!userName.trim() || userName === userProfile?.name}
                >
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-dental-primary">Mensagem Padrão WhatsApp</CardTitle>
                <CardDescription>
                  Configure a mensagem enviada aos pacientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="whatsappMessage">Mensagem</Label>
                  <Textarea
                    id="whatsappMessage"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    placeholder="Digite sua mensagem padrão..."
                    rows={4}
                    disabled={userProfile?.role !== 'admin'}
                  />
                  <p className="text-xs text-dental-secondary mt-2">
                    Variáveis disponíveis: {'{nome_do_paciente}'}, {'{data_proximo_contato}'}
                  </p>
                </div>
                {userProfile?.role === 'admin' && (
                  <Button 
                    onClick={handleSaveWhatsappMessage}
                    className="bg-dental-primary hover:bg-dental-secondary"
                    disabled={!whatsappMessage.trim() || whatsappMessage === organizationSettings?.whatsapp_default_message}
                  >
                    Salvar Mensagem
                  </Button>
                )}
                {userProfile?.role !== 'admin' && (
                  <p className="text-sm text-amber-600">
                    Apenas administradores podem editar a mensagem padrão.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-dental-primary">Importação de Pacientes</CardTitle>
                <CardDescription>
                  Importe pacientes em massa a partir de planilhas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowExcelImport(true)}
                  className="w-full bg-dental-primary hover:bg-dental-secondary"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Importar Planilha
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="removal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-dental-primary">Remoção de Pacientes</CardTitle>
                <CardDescription>
                  Gerencie e remova pacientes do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowPatientRemoval(true)}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Gerenciar Remoção de Pacientes
                </Button>
              </CardContent>
            </Card>
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
