import React from 'react';
import { usePatientAppointments } from '@/hooks/usePatientAppointments';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientAppointmentsProps {
  patientId: string;
}

export const PatientAppointments: React.FC<PatientAppointmentsProps> = ({ patientId }) => {
  const { appointments, loading } = usePatientAppointments(patientId);

  if (loading) {
    return <p className="text-sm text-dental-secondary p-4">Carregando...</p>;
  }

  if (appointments.length === 0) {
    return <p className="text-sm text-dental-secondary p-4">Nenhuma consulta encontrada.</p>;
  }

  return (
    <div className="space-y-3 p-1">
      {appointments.map(appointment => (
        <Card key={appointment.id}>
          <CardContent className="p-3">
            <div className="font-medium text-dental-primary">{appointment.title}</div>
            <div className="flex items-center gap-2 text-sm text-dental-secondary mt-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(appointment.start_time), 'dd/MM/yyyy', { locale: ptBR })}</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>
                {format(new Date(appointment.start_time), 'HH:mm', { locale: ptBR })} -
                {format(new Date(appointment.end_time), 'HH:mm', { locale: ptBR })}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
