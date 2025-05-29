
import React, { useState, useMemo } from 'react';
import { PatientCard } from '@/components/PatientCard';
import { PatientForm } from '@/components/PatientForm';
import { ContactForm } from '@/components/ContactForm';
import { FilterBar } from '@/components/FilterBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AuthGuard } from '@/components/AuthGuard';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { SettingsModal } from '@/components/SettingsModal';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useSupabasePatients } from '@/hooks/useSupabasePatients';
import { Patient, ContactRecord } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, History, UserX, Phone, MessageSquare, Calendar, Settings, Shield, AlertTriangle } from 'lucide-react';
import { format, isAfter, isBefore, startOfMonth, endOfMonth, addMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, signOut } = useAuth();
  const { userProfile, organizationSettings, loading: orgLoading, createOrganization, joinOrganization, updateProfile, updateOrganizationSettings } = useOrganization(user?.id);
  const { patients, loading: patientsLoading, addPatient, bulkAddPatients, updatePatient, addContactRecord, deletePatient, bulkDeletePatients } = useSupabasePatients(userProfile?.organization_id);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('active');
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const [contactingPatient, setContactingPatient] = useState<Patient | undefined>();
  
  // Estados para proteção contra edições acidentais
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const filteredPatients = useMemo(() => {
    console.log('Aplicando filtros. Total de pacientes:', patients.length);
    
    let filtered = patients;

    // Filtrar por status
    if (activeTab === 'active') {
      filtered = filtered.filter(patient => patient.status === 'active');
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(patient => patient.status === 'inactive');
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
      );
    }

    // Filtrar por período (apenas para pacientes ativos)
    if (activeTab === 'active') {
      const now = new Date();
      
      if (periodFilter === 'thisMonth') {
        const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
        filtered = filtered.filter(patient => 
          patient.nextContactDate >= thisMonth.start && patient.nextContactDate <= thisMonth.end
        );
      } else if (periodFilter === 'nextMonth') {
        const nextMonth = { start: startOfMonth(addMonths(now, 1)), end: endOfMonth(addMonths(now, 1)) };
        filtered = filtered.filter(patient => 
          patient.nextContactDate >= nextMonth.start && patient.nextContactDate <= nextMonth.end
        );
      } else if (periodFilter === 'overdue') {
        filtered = filtered.filter(patient => isBefore(patient.nextContactDate, now));
      }

      // Filtro adicional para mostrar apenas atrasados
      if (showOverdueOnly) {
        filtered = filtered.filter(patient => isBefore(patient.nextContactDate, now));
      }

      // Ordenar por data do próximo contato
      filtered.sort((a, b) => {
        const aOverdue = isBefore(a.nextContactDate, now);
        const bOverdue = isBefore(b.nextContactDate, now);
        
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        return a.nextContactDate.getTime() - b.nextContactDate.getTime();
      });
    }
    
    return filtered;
  }, [patients, activeTab, searchTerm, periodFilter, showOverdueOnly]);

  const stats = useMemo(() => {
    const activePatients = patients.filter(p => p.status === 'active');
    const now = new Date();
    const overdue = activePatients.filter(p => isBefore(p.nextContactDate, now));
    const thisMonth = activePatients.filter(p => isSameMonth(p.nextContactDate, now));
    
    return {
      total: activePatients.length,
      overdue: overdue.length,
      thisMonth: thisMonth.length,
      totalContacts: patients.reduce((sum, p) => sum + p.contactHistory.length, 0)
    };
  }, [patients]);

  const handleSavePatient = (patientData: Omit<Patient, 'id' | 'contactHistory'>) => {
    if (!user?.id) return;

    const action = () => {
      if (editingPatient) {
        updatePatient(editingPatient.id, patientData, user.id);
      } else {
        addPatient(patientData, user.id);
      }
      setShowPatientForm(false);
      setEditingPatient(undefined);
    };

    if (editingPatient) {
      setConfirmDialog({
        isOpen: true,
        title: 'Confirmar alterações',
        message: 'Tem certeza que deseja salvar as alterações nos dados do paciente?',
        onConfirm: () => {
          action();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      action();
    }
  };

  const handleContactPatient = (patient: Patient) => {
    setContactingPatient(patient);
    setShowContactForm(true);
  };

  const handleSaveContact = (contactRecord: Omit<ContactRecord, 'id'>, nextContactDate?: Date) => {
    if (contactingPatient && user?.id) {
      addContactRecord(contactingPatient.id, contactRecord, user.id, nextContactDate);
    }
    setShowContactForm(false);
    setContactingPatient(undefined);
  };

  const handleBulkImport = (importedPatients: Omit<Patient, 'id' | 'contactHistory'>[]) => {
    if (!user?.id) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar importação',
      message: `Tem certeza que deseja importar ${importedPatients.length} pacientes? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        bulkAddPatients(importedPatients, user.id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeletePatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o paciente "${patient?.name}"? Esta ação não pode ser desfeita.`,
      variant: 'destructive',
      onConfirm: () => {
        deletePatient(patientId);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBulkDelete = (patientIds: string[]) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar exclusão em massa',
      message: `Tem certeza que deseja excluir ${patientIds.length} pacientes? Esta ação não pode ser desfeita.`,
      variant: 'destructive',
      onConfirm: () => {
        bulkDeletePatients(patientIds);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleOverdueClick = () => {
    setActiveTab('active');
    setPeriodFilter('overdue');
    // Scroll suave até a lista
    setTimeout(() => {
      const listElement = document.getElementById('patient-list');
      if (listElement) {
        listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Loading state
  const loading = orgLoading || patientsLoading;

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-dental-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-dental-secondary">Carregando dados seguros...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Show onboarding if user has no profile
  if (!userProfile) {
    return (
      <AuthGuard>
        <OnboardingFlow
          onCreateOrganization={createOrganization}
          onJoinOrganization={joinOrganization}
        />
      </AuthGuard>
    );
  }

  const renderContactHistory = () => {
    const allContacts = patients
      .flatMap(patient => 
        patient.contactHistory.map(contact => ({
          ...contact,
          patientName: patient.name,
          patientPhone: patient.phone
        }))
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
      <div className="space-y-3">
        {allContacts.length === 0 ? (
          <Card className="border-dental-primary/20">
            <CardContent className="p-6 text-center text-dental-secondary">
              <History className="w-12 h-12 mx-auto mb-3 text-dental-accent" />
              <p>Nenhum contato registrado ainda</p>
            </CardContent>
          </Card>
        ) : (
          allContacts.map(contact => (
            <Card key={contact.id} className="mb-3 border-dental-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-dental-primary">{contact.patientName}</h3>
                    <p className="text-sm text-dental-secondary">{contact.patientPhone}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={contact.successful ? "default" : "secondary"} className={contact.successful ? "bg-dental-primary" : ""}>
                      {contact.successful ? "Sucesso" : "Sem sucesso"}
                    </Badge>
                    <p className="text-xs text-dental-secondary mt-1">
                      {format(contact.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  {contact.method === 'whatsapp' && <MessageSquare className="w-4 h-4 text-dental-primary" />}
                  {contact.method === 'phone' && <Phone className="w-4 h-4 text-dental-primary" />}
                  {contact.method === 'in-person' && <Users className="w-4 h-4 text-dental-primary" />}
                  <span className="text-sm capitalize text-dental-secondary">{contact.method}</span>
                </div>
                
                {contact.notes && (
                  <p className="text-sm text-dental-primary bg-dental-background p-2 rounded">
                    {contact.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  const renderInactivePatients = () => {
    const inactivePatients = patients.filter(p => p.status === 'inactive');
    
    return (
      <div className="space-y-3">
        {inactivePatients.length === 0 ? (
          <Card className="border-dental-primary/20">
            <CardContent className="p-6 text-center text-dental-secondary">
              <UserX className="w-12 h-12 mx-auto mb-3 text-dental-accent" />
              <p>Nenhum paciente inativo</p>
            </CardContent>
          </Card>
        ) : (
          inactivePatients.map(patient => (
            <Card key={patient.id} className="mb-3 border-red-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-700">{patient.name}</h3>
                    <p className="text-sm text-gray-600">{patient.phone}</p>
                  </div>
                  <Badge variant="destructive">Inativo</Badge>
                </div>
                
                <div className="text-sm text-dental-secondary mb-2">
                  <strong>Última consulta:</strong> {format(patient.lastVisit, 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                
                {patient.inactiveReason && (
                  <div className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                    <strong>Motivo:</strong> {patient.inactiveReason}
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingPatient(patient);
                    setShowPatientForm(true);
                  }}
                  className="mt-3 border-dental-primary text-dental-primary hover:bg-dental-background"
                >
                  Editar
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent">
        <div className="container mx-auto px-4 py-6 max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-dental-primary" />
              <div>
                <h1 className="text-xl font-bold text-dental-primary">
                  Gestão de Pacientes
                </h1>
                <p className="text-xs text-dental-secondary">
                  {(userProfile as any)?.organizations?.name}
                </p>
              </div>
            </div>
            <UserAvatar
              userProfile={userProfile}
              onSettingsClick={() => setShowSettings(true)}
              onSignOut={signOut}
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="bg-[#fdf3e7] border-dental-primary/30">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-dental-primary">{stats.total}</div>
                <div className="text-xs font-semibold text-dental-primary">Pacientes Ativos</div>
              </CardContent>
            </Card>
            <Card 
              className="bg-red-50 border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
              onClick={handleOverdueClick}
            >
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                </div>
                <div className="text-xs font-medium text-red-600">Atrasados</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-dental-background">
              <TabsTrigger value="active" className="text-xs data-[state=active]:bg-dental-primary data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-1" />
                Ativos
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs data-[state=active]:bg-dental-primary data-[state=active]:text-white">
                <History className="w-4 h-4 mr-1" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="inactive" className="text-xs data-[state=active]:bg-dental-primary data-[state=active]:text-white">
                <UserX className="w-4 h-4 mr-1" />
                Inativos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-dental-primary">Pacientes Ativos</h2>
                <Button
                  onClick={() => setShowPatientForm(true)}
                  size="sm"
                  className="bg-dental-primary hover:bg-dental-secondary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Novo
                </Button>
              </div>

              <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                periodFilter={periodFilter}
                onPeriodFilterChange={setPeriodFilter}
                showOverdueOnly={showOverdueOnly}
                onShowOverdueOnlyChange={setShowOverdueOnly}
              />

              <div id="patient-list" className="space-y-3">
                {filteredPatients.length === 0 ? (
                  <Card className="border-dental-primary/20">
                    <CardContent className="p-6 text-center text-dental-secondary">
                      <Users className="w-12 h-12 mx-auto mb-3 text-dental-accent" />
                      <p>Nenhum paciente encontrado</p>
                      <Button
                        onClick={() => setShowPatientForm(true)}
                        className="mt-3 bg-dental-primary hover:bg-dental-secondary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar paciente
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPatients.map(patient => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      organizationSettings={organizationSettings}
                      onEdit={(patient) => {
                        setEditingPatient(patient);
                        setShowPatientForm(true);
                      }}
                      onContact={handleContactPatient}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="mb-4">
                <h2 className="text-lg font-bold mb-2 text-dental-primary">Histórico de Contatos</h2>
                <p className="text-sm text-dental-secondary">
                  {stats.totalContacts} contatos registrados
                </p>
              </div>
              {renderContactHistory()}
            </TabsContent>

            <TabsContent value="inactive">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-dental-primary">Pacientes Inativos</h2>
              </div>
              {renderInactivePatients()}
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals */}
        {showPatientForm && (
          <PatientForm
            patient={editingPatient}
            onSave={handleSavePatient}
            onCancel={() => {
              setShowPatientForm(false);
              setEditingPatient(undefined);
            }}
          />
        )}

        {showContactForm && contactingPatient && (
          <ContactForm
            patient={contactingPatient}
            onSave={handleSaveContact}
            onCancel={() => {
              setShowContactForm(false);
              setContactingPatient(undefined);
            }}
          />
        )}

        {showSettings && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            userProfile={userProfile}
            organizationSettings={organizationSettings}
            patients={patients}
            onUpdateProfile={updateProfile}
            onUpdateSettings={updateOrganizationSettings}
            onBulkImport={handleBulkImport}
            onDeletePatient={handleDeletePatient}
            onBulkDelete={handleBulkDelete}
          />
        )}

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          variant={confirmDialog.variant}
        />
      </div>
    </AuthGuard>
  );
};

export default Index;
