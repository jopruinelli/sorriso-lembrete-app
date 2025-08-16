import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/types/appointment';

interface PatientInfo {
  name: string;
  lastVisit?: Date;
  nextContactDate?: Date;
  birthday?: Date;
}

interface MessageTemplateData {
  patient: PatientInfo;
  appointment?: Appointment;
}

export function formatMessage(template: string, { patient, appointment }: MessageTemplateData): string {
  const firstName = patient.name.split(' ')[0];
  let message = template
    .replace('{nome_do_paciente}', patient.name)
    .replace('{primeiro_nome_do_paciente}', firstName);

  if (patient.nextContactDate) {
    message = message.replace(
      '{data_proximo_contato}',
      format(patient.nextContactDate, 'dd/MM/yyyy', { locale: ptBR })
    );
  }

  if (patient.birthday) {
    message = message.replace(
      '{data_aniversario}',
      format(patient.birthday, 'dd/MM/yyyy', { locale: ptBR })
    );
  }

  if (patient.lastVisit) {
    message = message.replace(
      '{data_ultima_consulta}',
      format(patient.lastVisit, 'dd/MM/yyyy', { locale: ptBR })
    );
  }

  if (appointment) {
    message = message
      .replace(
        '{data_consulta}',
        format(new Date(appointment.start_time), 'dd/MM/yyyy', { locale: ptBR })
      )
      .replace(
        '{hora_consulta}',
        format(new Date(appointment.start_time), 'HH:mm', { locale: ptBR })
      );

    if (appointment.location) {
      const locationInfo = appointment.location.address
        ? `${appointment.location.name} - ${appointment.location.address}`
        : appointment.location.name;
      message = message.replace('{local_de_atendimento}', locationInfo);
    }
  }

  return message;
}
