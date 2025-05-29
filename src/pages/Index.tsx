
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useSupabasePatients } from '@/hooks/useSupabasePatients';
import { AuthGuard } from '@/components/AuthGuard';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { PatientCard } from '@/components/PatientCard';
import { PatientForm } from '@/components/PatientForm';
import { ContactForm } from '@/components/ContactForm';
import { FilterBar } from '@/components/FilterBar';
import { SettingsModal } from '@/components/SettingsModal';
import { UserAvatar } from '@/components/UserAvatar';
import { Patient, ContactRecord, ContactPeriod } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Users, Calendar, Settings, UserPlus } from 'lucide-react';
import { isAfter, format, parseISO, startOfDay } from 'date-fns';
import { useAuth as useSupabaseAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading: authLoading, signOut } = useSupabaseAuth();
  const { userProfile, organizationSettings, loading: orgLoading, createOrganization, joinOrganization, updateProfile, updateOrganizationSettings } = useOrganization(user?.id);
  const { patients, loading: patientsLoading, addPatient, updatePatient, addContactRecord, deletePatient, bulkAddPatients, bulkDeletePatients } = useSupabasePatients(userProfile?.organization_id);

  // State variables
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [contactPeriodFilter, setContactPeriodFilter] = useState<ContactPeriod | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'particular' | 'convenio'>('all');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const patientsListRef = useRef<HTMLDivElement>(null);

  // Filtering logic
  const today = startOfDay(new Date());
  
  const filteredPatients = patients.filter(patient => {
    if (statusFilter !== 'all' && patient.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && patient.paymentType !== paymentFilter) return false;
    if (searchTerm && !patient.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !patient.phone.includes(searchTerm)) return false;
    
    if (overdueFilter) {
      return isAfter(today, startOfDay(patient.nextContactDate));
    }
    
    if (contactPeriodFilter !== 'all') {
      const nextContactDate = startOfDay(patient.nextContactDate);
      const daysDiff = Math.ceil((nextContactDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (contactPeriodFilter) {
        case '1month': return daysDiff <= 30;
        case '3months': return daysDiff <= 90;
        case '6months': return daysDiff <= 180;
        case '1year': return daysDiff <= 365;
        default: return true;
      }
    }
    
    return true;
  });

  const overdueCount = patients.filter(patient => 
    patient.status === 'active' && isAfter(today, startOfDay(patient.nextContactDate))
  ).length;

  // Handler functions
  const handleAddPatient = async (patientData: Omit<Patient, 'id' | 'contactHistory'>) => {
    if (!user?.id) return;
    await addPatient(patientData, user.id);
    setShowPatientForm(false);
  };

  const handleUpdatePatient = async (patientData: Omit<Patient, 'id' | 'contactHistory'>) => {
    if (!editingPatient || !user?.id) return;
    await updatePatient(editingPatient.id, patientData, user.id);
    setEditingPatient(null);
    setShowPatientForm(false);
  };

  const handleAddContact = async (contactData: Omit<ContactRecord, 'id'>, nextContactDate?: Date) => {
    if (!selectedPatient || !user?.id) return;
    await addContactRecord(selectedPatient.id, contactData, user.id, nextContactDate);
    setSelectedPatient(null);
    setShowContactForm(false);
  };

  const handleOverdueFilterClick = () => {
    setOverdueFilter(true);
    setStatusFilter('active');
    setContactPeriodFilter('all');
    setPaymentFilter('all');
    setSearchTerm('');
    
    setTimeout(() => {
      patientsListRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const resetFilters = () => {
    setOverdueFilter(false);
    setStatusFilter('active');
    setContactPeriodFilter('all');
    setPaymentFilter('all');
    setSearchTerm('');
  };

  // Wrapper function for bulk import that includes userId
  const handleBulkImport = async (patientsData: Omit<Patient, 'id' | 'contactHistory'>[]) => {
    if (!user?.id) return;
    await bulkAddPatients(patientsData, user.id);
  };

  if (authLoading || orgLoading) {
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
        />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent">
          <div className="container mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-dental-primary">Gestão de Pacientes</h1>
                <p className="text-dental-secondary">{userProfile.organizations?.name || 'Organização não encontrada'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="border-dental-primary text-dental-primary hover:bg-dental-primary hover:text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Button>
                <UserAvatar 
                  userProfile={userProfile}
                  onSettingsClick={() => setShowSettings(true)}
                  onSignOut={signOut}
                />
              </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dental-secondary">Total de Pacientes</CardTitle>
                  <Users className="h-4 w-4 text-dental-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-dental-primary">{patients.length}</div>
                  <p className="text-xs text-dental-secondary">Pacientes cadastrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dental-secondary">Próximos Contatos</CardTitle>
                  <Calendar className="h-4 w-4 text-dental-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-dental-primary">
                    {patients.filter(p => {
                      const nextContact = startOfDay(p.nextContactDate);
                      const inNext7Days = nextContact <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                      return p.status === 'active' && !isAfter(today, nextContact) && inNext7Days;
                    }).length}
                  </div>
                  <p className="text-xs text-dental-secondary">Próximos 7 dias</p>
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
              
              {overdueFilter && (
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
              overdueFilter={overdueFilter}
              setOverdueFilter={setOverdueFilter}
            />

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
                    onContact={() => {
                      setSelectedPatient(patient);
                      setShowContactForm(true);
                    }}
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
                onSave={editingPatient ? handleUpdatePatient : handleAddPatient}
                onCancel={() => {
                  setShowPatientForm(false);
                  setEditingPatient(null);
                }}
              />
            )}

            {showContactForm && selectedPatient && (
              <ContactForm
                patient={selectedPatient}
                onSave={handleAddContact}
                onCancel={() => {
                  setShowContactForm(false);
                  setSelectedPatient(null);
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
                onBulkImport={handleBulkImport}
                onDeletePatient={deletePatient}
                onBulkDelete={bulkDeletePatients}
              />
            )}
          </div>
        </div>
      )}
    </AuthGuard>
  );
};

export default Index;
