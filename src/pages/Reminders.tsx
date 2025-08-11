import React, { useMemo, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { AppNavigation } from '@/components/AppNavigation';
import { ReminderFilterBar, ReminderType } from '@/components/ReminderFilterBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, Cake, Phone } from 'lucide-react';
import { useAuth as useSupabaseAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useSupabasePatients } from '@/hooks/useSupabasePatients';
import { useAppointments } from '@/hooks/useAppointments';
import { ContactPeriod, Patient } from '@/types/patient';
import { Appointment } from '@/types/appointment';
import { format, startOfDay, isAfter, addYears, setYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatMessage } from '@/utils/messageTemplates';

interface ReminderPatient {
  name: string;
  phone: string;
  status: Exclude<Patient['status'], 'closed'>;
  nextContactDate?: Date;
  lastVisit?: Date;
}

interface Reminder {
  id: string;
  type: Exclude<ReminderType, 'all'>;
  date: Date;
  patient: ReminderPatient;
  appointment?: Appointment;
}

const Reminders: React.FC = () => {
  const { user, loading: authLoading, signOut } = useSupabaseAuth();
  const { userProfile, organizationSettings, loading: orgLoading } = useOrganization(user);
  const { patients, loading: patientsLoading } = useSupabasePatients(userProfile?.organization_id);
  const { appointments, loading: apptsLoading } = useAppointments();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ReminderType>('all');
  const [contactPeriodFilter, setContactPeriodFilter] = useState<ContactPeriod | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const today = startOfDay(new Date());

  const typeIcons = {
    appointment: Calendar,
    birthday: Cake,
    contact: Phone,
  } as const;

  const reminders = useMemo(() => {
    const nonClosedPatients = patients.filter(p => p.status !== 'closed');
    const patientMap = new Map(nonClosedPatients.map(p => [p.id, p]));

    const appointmentReminders: Reminder[] = appointments
      .map(a => {
        const patient = patientMap.get(a.patient_id);
        if (!patient) return null;
        return {
          id: `appt-${a.id}`,
          type: 'appointment',
          date: new Date(a.start_time),
          patient: {
            name: patient.name,
            phone: patient.phone,
            status: patient.status,
          },
          appointment: a,
        } as Reminder;
      })
      .filter((r): r is Reminder => r !== null);

    const birthdayReminders: Reminder[] = nonClosedPatients
      .filter(p => p.birthDate)
      .map(p => {
        const birth = p.birthDate!;
        let next = setYear(birth, today.getFullYear());
        if (isAfter(today, next)) {
          next = addYears(next, 1);
        }
        return {
          id: `bday-${p.id}`,
          type: 'birthday',
          date: next,
          patient: { name: p.name, phone: p.phone, status: p.status },
        } as Reminder;
      });

    const contactReminders: Reminder[] = nonClosedPatients.map(p => ({
      id: `contact-${p.id}`,
      type: 'contact',
      date: p.nextContactDate,
      patient: {
        name: p.name,
        phone: p.phone,
        nextContactDate: p.nextContactDate,
        status: p.status,
      },
    }));

    return [...appointmentReminders, ...birthdayReminders, ...contactReminders];
  }, [appointments, patients, today]);

  const filteredReminders = useMemo(() => {
    return reminders
      .filter(r => {
        if (searchTerm && !r.patient.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (r.patient.status === 'closed') return false;
        if (statusFilter !== 'all' && r.patient.status.toLowerCase() !== statusFilter) return false;
        if (typeFilter !== 'all' && r.type !== typeFilter) return false;
        const reminderDay = startOfDay(r.date);
        const isOverdue = isAfter(today, reminderDay);
        if (contactPeriodFilter === 'overdue') {
          return isOverdue;
        }
        if (isOverdue) return false;
        if (contactPeriodFilter !== 'all') {
          const daysDiff = Math.ceil(
            (reminderDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
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
        return true;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [reminders, searchTerm, typeFilter, contactPeriodFilter, statusFilter, today]);

  const handleWhatsApp = (reminder: Reminder) => {
    const phone = reminder.patient.phone;
    if (!phone) return;

    let message = '';
    if (reminder.type === 'appointment') {
      message = formatMessage(
        organizationSettings?.whatsapp_appointment_message || '',
        { patient: { name: reminder.patient.name }, appointment: reminder.appointment }
      );
    } else if (reminder.type === 'birthday') {
      message = formatMessage(
        organizationSettings?.whatsapp_birthday_message || '',
        { patient: { name: reminder.patient.name, birthday: reminder.date } }
      );
    } else if (reminder.type === 'contact') {
      message = formatMessage(
        organizationSettings?.whatsapp_default_message || '',
        { patient: { name: reminder.patient.name, nextContactDate: reminder.date } }
      );
    }

    const url = `https://wa.me/55${phone.replace(/\D/g, '')}` +
      (message ? `?text=${encodeURIComponent(message)}` : '');
    window.open(url, '_blank');
  };

  if (authLoading || orgLoading || patientsLoading || apptsLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <AuthGuard>
      <AppNavigation
        userProfile={userProfile}
        onSettingsClick={() => {}}
        onSignOut={signOut}
      >
        <div className="p-4 space-y-4">
          <ReminderFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            contactPeriodFilter={contactPeriodFilter}
            setContactPeriodFilter={setContactPeriodFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          {filteredReminders.length === 0 ? (
            <p className="text-dental-secondary">Nenhum lembrete encontrado.</p>
          ) : (
            filteredReminders.map(reminder => {
              const Icon = typeIcons[reminder.type];
              return (
                <Card key={reminder.id} className="border-l-4 border-dental-primary">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-dental-primary" />
                      <div>
                        <div className="font-semibold text-dental-primary">{reminder.patient.name}</div>
                        <div className="text-sm text-dental-secondary">
                          {reminder.type === 'appointment'
                            ? format(reminder.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            : format(reminder.date, 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleWhatsApp(reminder)}
                      className="text-dental-primary"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </AppNavigation>
    </AuthGuard>
  );
};

export default Reminders;
