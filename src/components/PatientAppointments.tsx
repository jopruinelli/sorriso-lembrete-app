import React from 'react';
import { usePatientAppointments } from '@/hooks/usePatientAppointments';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatMessage } from '@/utils/messageTemplates';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { OrganizationSettings } from '@/types/organization';
import { Patient } from '@/types/patient';
import { Appointment } from '@/types/appointment';

interface PatientAppointmentsProps {
  patientId: string;
  patient: Patient;
  organizationSettings?: OrganizationSettings | null;
}

export const PatientAppointments: React.FC<PatientAppointmentsProps> = ({
  patientId,
  patient,
  organizationSettings,
}) => {
  const { appointments, loading } = usePatientAppointments(patientId);
  const navigate = useNavigate();

  const handleWhatsApp = (
    appointment: Appointment,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    const defaultMessage =
      organizationSettings?.whatsapp_appointment_message ||
      'Olá {nome_do_paciente}! Lembrete da sua consulta em {data_consulta} às {hora_consulta} no {local_de_atendimento}.';
    const message = formatMessage(defaultMessage, { patient, appointment });
    const phone = patient.phone;
    const url = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, '_blank');
  };

  const handleCardClick = (appointment: Appointment) => {
    const dateParam = format(
      new Date(appointment.start_time),
      'yyyy-MM-dd'
    );
    const hourParam = format(new Date(appointment.start_time), 'HH');
    navigate(`/appointments?date=${dateParam}&hour=${hourParam}`);
  };

  if (loading) {
    return <p className="text-sm text-dental-secondary p-4">Carregando...</p>;
  }

  if (appointments.length === 0) {
    return <p className="text-sm text-dental-secondary p-4">Nenhuma consulta encontrada.</p>;
  }

  return (
    <div className="space-y-3 p-1">
      {appointments.map((appointment) => {
        const isFuture = new Date(appointment.start_time) > new Date();
        return (
          <Card
            key={appointment.id}
            onClick={() => handleCardClick(appointment)}
            className="cursor-pointer"
          >
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-dental-primary">{appointment.title}</div>
                <div className="flex items-center gap-2 text-sm text-dental-secondary mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(appointment.start_time), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>
                    {format(new Date(appointment.start_time), 'HH:mm', {
                      locale: ptBR,
                    })}{' '}
                    -
                    {format(new Date(appointment.end_time), 'HH:mm', {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
              {isFuture && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  onClick={(e) => handleWhatsApp(appointment, e)}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
