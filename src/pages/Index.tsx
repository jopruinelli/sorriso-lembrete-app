
import React, { useState, useMemo } from 'react';
import { PatientCard } from '@/components/PatientCard';
import { PatientForm } from '@/components/PatientForm';
import { ContactForm } from '@/components/ContactForm';
import { FilterBar } from '@/components/FilterBar';
import { usePatients } from '@/hooks/usePatients';
import { Patient, ContactRecord } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, History, UserX, Phone, MessageSquare, Calendar } from 'lucide-react';
import { format, isAfter, isBefore, startOfMonth, endOfMonth, addMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { patients, addPatient, updatePatient, addContactRecord } = usePatients();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('active');
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const [contactingPatient, setContactingPatient] = useState<Patient | undefined>();
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const filteredPatients = useMemo(() => {
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
      const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
      const nextMonth = { start: startOfMonth(addMonths(now, 1)), end: endOfMonth(addMonths(now, 1)) };

      if (periodFilter === 'thisMonth') {
        filtered = filtered.filter(patient =>
          patient.nextContactDate >= thisMonth.start && patient.nextContactDate <= thisMonth.end
        );
      } else if (periodFilter === 'nextMonth') {
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

      // Ordenar por data do próximo contato (atrasados primeiro)
      filtered.sort((a, b) => a.nextContactDate.getTime() - b.nextContactDate.getTime());
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
    if (editingPatient) {
      updatePatient(editingPatient.id, patientData);
      toast({
        title: "Paciente atualizado",
        description: "Os dados do paciente foram salvos com sucesso.",
      });
    } else {
      addPatient(patientData);
      toast({
        title: "Paciente adicionado",
        description: "Novo paciente foi cadastrado com sucesso.",
      });
    }
    setShowPatientForm(false);
    setEditingPatient(undefined);
  };

  const handleContactPatient = (patient: Patient) => {
    setContactingPatient(patient);
    setShowContactForm(true);
  };

  const handleSaveContact = (contactRecord: Omit<ContactRecord, 'id'>, nextContactDate?: Date) => {
    if (contactingPatient) {
      addContactRecord(contactingPatient.id, contactRecord, nextContactDate);
      toast({
        title: "Contato registrado",
        description: `Contato com ${contactingPatient.name} foi registrado com sucesso.`,
      });
    }
    setShowContactForm(false);
    setContactingPatient(undefined);
  };

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
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum contato registrado ainda</p>
            </CardContent>
          </Card>
        ) : (
          allContacts.map(contact => (
            <Card key={contact.id} className="mb-3">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{contact.patientName}</h3>
                    <p className="text-sm text-gray-600">{contact.patientPhone}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={contact.successful ? "default" : "secondary"}>
                      {contact.successful ? "Sucesso" : "Sem sucesso"}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(contact.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  {contact.method === 'whatsapp' && <MessageSquare className="w-4 h-4" />}
                  {contact.method === 'phone' && <Phone className="w-4 h-4" />}
                  {contact.method === 'in-person' && <Users className="w-4 h-4" />}
                  <span className="text-sm capitalize">{contact.method}</span>
                </div>
                
                {contact.notes && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
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
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <UserX className="w-12 h-12 mx-auto mb-3 text-gray-300" />
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
                
                <div className="text-sm text-gray-600 mb-2">
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
                  className="mt-3"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Gestão de Pacientes
          </h1>
          <p className="text-gray-600 text-sm">
            Acompanhamento odontológico simplificado
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-blue-600">Pacientes Ativos</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-xs text-red-600">Atrasados</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="active" className="text-xs">
              <Users className="w-4 h-4 mr-1" />
              Ativos
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <History className="w-4 h-4 mr-1" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs">
              <UserX className="w-4 h-4 mr-1" />
              Inativos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Pacientes Ativos</h2>
              <Button
                onClick={() => setShowPatientForm(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
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

            {filteredPatients.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum paciente encontrado</p>
                  <Button
                    onClick={() => setShowPatientForm(true)}
                    className="mt-3 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar primeiro paciente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map(patient => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onEdit={(patient) => {
                      setEditingPatient(patient);
                      setShowPatientForm(true);
                    }}
                    onContact={handleContactPatient}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Histórico de Contatos</h2>
              <p className="text-sm text-gray-600">
                {stats.totalContacts} contatos registrados
              </p>
            </div>
            {renderContactHistory()}
          </TabsContent>

          <TabsContent value="inactive">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Pacientes Inativos</h2>
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
    </div>
  );
};

export default Index;
