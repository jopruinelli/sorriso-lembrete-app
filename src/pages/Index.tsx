
import React, { useState, useRef } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useSupabasePatients } from '@/hooks/useSupabasePatients';
import { AuthGuard } from '@/components/AuthGuard';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { PatientCard } from '@/components/PatientCard';
import { PatientForm } from '@/components/PatientForm';
import { FilterBar } from '@/components/FilterBar';
import { SettingsModal } from '@/components/SettingsModal';
import { UserAvatar } from '@/components/UserAvatar';
import { AppNavigation } from '@/components/AppNavigation';
import { Patient, ContactPeriod, PatientCreateData } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Users, Calendar, Settings, UserPlus, Clock } from 'lucide-react';
import { isAfter, format, parseISO, startOfDay } from 'date-fns';
import { useAuth as useSupabaseAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading: authLoading, signOut } = useSupabaseAuth();
  const { userProfile, organizationSettings, loading: orgLoading, createOrganization, joinOrganization, updateProfile, updateOrganizationSettings } = useOrganization(user);
  const { patients, loading: patientsLoading, addPatient, updatePatient, deletePatient, bulkAddPatients, bulkDeletePatients } = useSupabasePatients(userProfile?.organization_id);

  console.log('📱 Index component render:', { 
    user: user?.email, 
    authLoading, 
    orgLoading, 
    userProfile: userProfile?.name,
    organizationId: userProfile?.organization_id
  });

  // State variables
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'closed'>('all');
  const [contactPeriodFilter, setContactPeriodFilter] = useState<ContactPeriod | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'particular' | 'convenio'>('all');
  const patientsListRef = useRef<HTMLDivElement>(null);

  // Filtering logic
  const today = startOfDay(new Date());
  
  const filteredPatients = patients.filter(patient => {
    if (statusFilter !== 'all' && patient.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && patient.paymentType !== paymentFilter) return false;
    if (
      searchTerm &&
      !patient.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !patient.phone.includes(searchTerm)
    )
      return false;

    const nextContactDate = startOfDay(patient.nextContactDate);
    const isPatientOverdue = isAfter(today, nextContactDate);

      // Filtro "Atrasados" no seletor de período
      if (contactPeriodFilter === 'overdue') {
        return isPatientOverdue;
      }

      // Nas opções de período (1m, 3m, 6m, 1a) ignorar pacientes atrasados
      if (contactPeriodFilter !== 'all') {
        if (isPatientOverdue) return false;

      const daysDiff = Math.ceil(
        (nextContactDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      switch (contactPeriodFilter) {
        case '1month':
          return daysDiff <= 30;
        case '3months':
          return daysDiff <= 90;
        case '6months':
          return daysDiff <= 180;
        case '1year':
          return daysDiff <= 365;
        default:
          return true;
      }
    }

    // "Todos os períodos" sem filtro de atraso exibe todos
    return true;
  });

  const overdueCount = patients.filter(patient =>
    patient.status === 'active' && isAfter(today, startOfDay(patient.nextContactDate))
  ).length;

  const upcomingCount = patients.filter(p => {
    if (p.status !== 'active') return false;
    const nextContact = startOfDay(p.nextContactDate);
    const isPatientOverdue = isAfter(today, nextContact);
    const inNextMonth = nextContact <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return !isPatientOverdue && inNextMonth;
  }).length;

  const activePatientsCount = patients.filter(p => p.status === 'active').length;

  const filtersAreDefault =
    statusFilter === 'all' &&
      contactPeriodFilter === 'all' &&
      paymentFilter === 'all' &&
      searchTerm === '';

  // Handler functions
  const handleAddPatient = async (patientData: PatientCreateData) => {
    if (!user?.id) return;
    await addPatient(patientData, user.id);
    setShowPatientForm(false);
  };

  const handleUpdatePatient = async (patientData: PatientCreateData) => {
    if (!editingPatient || !user?.id) return;
    await updatePatient(editingPatient.id, patientData, user.id);
    setEditingPatient(null);
    setShowPatientForm(false);
  };

  const handleOverdueFilterClick = () => {
    setStatusFilter('active');
    setContactPeriodFilter('overdue');
    setPaymentFilter('all');
    setSearchTerm('');

    setTimeout(() => {
      patientsListRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handleUpcomingFilterClick = () => {
    setStatusFilter('active');
    setContactPeriodFilter('1month');
    setPaymentFilter('all');
    setSearchTerm('');

    setTimeout(() => {
      patientsListRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handleActivePatientsClick = () => {
    resetFilters();
    setStatusFilter('active');

    setTimeout(() => {
      patientsListRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setContactPeriodFilter('all');
    setPaymentFilter('all');
    setSearchTerm('');
  };

  // Wrapper function for bulk import that includes userId
  const handleBulkImport = async (patientsData: PatientCreateData[]) => {
    if (!user?.id) return;
    await bulkAddPatients(patientsData, user.id);
  };

  if (authLoading || orgLoading) {
    console.log('⏳ Index: showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-dental-primary/20">
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 border-4 border-dental-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-dental-secondary">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard>
      {!userProfile ? (
        <OnboardingFlow
          onCreateOrganization={createOrganization}
          onJoinOrganization={joinOrganization}
          userEmail={user?.email}
        />
      ) : userProfile.status === 'pending' ? (
        <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent flex items-center justify-center p-4">
          {/* Cabeçalho com e-mail e botão sair para usuários pending */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <span className="text-sm text-dental-secondary bg-white/80 px-2 py-1 rounded">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="border-dental-primary text-dental-primary hover:bg-dental-primary hover:text-white"
            >
              Sair
            </Button>
          </div>

          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto text-dental-secondary mb-4" />
              <h2 className="text-xl font-semibold text-dental-primary mb-2">
                Aguardando Aprovação
              </h2>
              <p className="text-dental-secondary mb-4">
                Sua solicitação de acesso foi enviada e está aguardando aprovação do administrador.
              </p>
              <Button onClick={signOut} variant="outline">
                Fazer logout
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : userProfile.status === 'rejected' ? (
        <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent flex items-center justify-center p-4">
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <span className="text-sm text-dental-secondary bg-white/80 px-2 py-1 rounded">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="border-dental-primary text-dental-primary hover:bg-dental-primary hover:text-white"
            >
              Sair
            </Button>
          </div>

          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-dental-primary mb-2">
                Acesso Negado
              </h2>
              <p className="text-dental-secondary mb-4">
                Seu acesso foi rejeitado pelo administrador.
              </p>
              <Button onClick={signOut} variant="outline">
                Fazer logout
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <AppNavigation
          userProfile={userProfile}
          onSettingsClick={() => setShowSettings(true)}
          onSignOut={signOut}
          topBarContent={
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-dental-primary">Gestão de Pacientes</span>
              <span className="text-xs font-normal text-dental-secondary">
                {userProfile.organizations?.name || 'Organização não encontrada'}
              </span>
            </div>
          }
        >
          <div className="container mx-auto max-w-7xl">
            {/* Dashboard Cards */}
            <p className="text-sm text-dental-secondary mb-2">Pacientes Ativos</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleUpcomingFilterClick}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dental-secondary">Próximos Contatos</CardTitle>
                  <Calendar className="h-4 w-4 text-dental-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-dental-primary">{upcomingCount}</div>
                  <p className="text-xs text-dental-secondary">Próximos 30 dias</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleOverdueFilterClick}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dental-secondary">Atrasados</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                  <p className="text-xs text-dental-secondary">Pacientes com contato em atraso</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleActivePatientsClick}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dental-secondary">Total de Pacientes</CardTitle>
                  <Users className="h-4 w-4 text-dental-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-dental-primary">{activePatientsCount}</div>
                  <p className="text-xs text-dental-secondary">Pacientes Ativos</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Button
                onClick={() => setShowPatientForm(true)}
                className="bg-dental-primary hover:bg-dental-secondary"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Paciente
              </Button>

              {!filtersAreDefault && (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="border-dental-primary text-dental-primary hover:bg-dental-primary hover:text-white"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Filter Bar */}
              <FilterBar
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                contactPeriodFilter={contactPeriodFilter}
                setContactPeriodFilter={setContactPeriodFilter}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                paymentFilter={paymentFilter}
                setPaymentFilter={setPaymentFilter}
              />

            {/* Patient Count */}
            <div className="mb-4">
              <p className="text-sm text-dental-secondary">
                Mostrando {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} de {patients.length} total
              </p>
            </div>

            {/* Patients List */}
            <div ref={patientsListRef} className="space-y-4">
              {patientsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-dental-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-dental-secondary">Carregando pacientes...</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-dental-secondary">
                      {patients.length === 0 ? "Nenhum paciente cadastrado ainda." : "Nenhum paciente encontrado com os filtros aplicados."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onEdit={() => {
                      setEditingPatient(patient);
                      setShowPatientForm(true);
                    }}
                    organizationSettings={organizationSettings}
                  />
                ))
              )}
            </div>

            {/* Modals */}
            {showPatientForm && (
              <PatientForm
                patient={editingPatient}
                organizationSettings={organizationSettings}
                onSave={editingPatient ? handleUpdatePatient : handleAddPatient}
                onCancel={() => {
                  setShowPatientForm(false);
                  setEditingPatient(null);
                }}
              />
            )}

            {showSettings && userProfile && (
              <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                userProfile={userProfile}
                organizationSettings={organizationSettings}
                patients={patients}
                onUpdateProfile={updateProfile}
                onUpdateSettings={updateOrganizationSettings}
                onBulkImport={bulkAddPatients}
                fetchLocations={() => Promise.resolve()}
                fetchTitles={() => Promise.resolve()}
                onDeletePatient={deletePatient}
                onBulkDelete={bulkDeletePatients}
              />
            )}
          </div>
        </AppNavigation>
      )}
    </AuthGuard>
  );
};

export default Index;
