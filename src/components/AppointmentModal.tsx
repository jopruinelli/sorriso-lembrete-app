import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addHours, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Clock, MapPin, User, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { useAppointments } from '@/hooks/useAppointments';
import { Appointment, Location, AppointmentFormData } from '@/types/appointment';
import { Patient } from '@/types/patient';

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Selecione um paciente'),
  location_id: z.string().min(1, 'Selecione um local'),
  title: z.string().min(1, 'Digite um título'),
  start_time: z.date(),
  end_time: z.date(),
  notes: z.string().optional(),
  recurrence_type: z.enum(['none', 'monthly', 'semiannual', 'annual']),
  recurrence_end_date: z.date().optional(),
});

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  selectedTimeSlot?: { date: Date; hour: number } | null;
  patients: Patient[];
  locations: Location[];
}

export function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  selectedTimeSlot,
  patients,
  locations,
}: AppointmentModalProps) {
  const [conflicts, setConflicts] = useState<Appointment[]>([]);
  const { createAppointment, updateAppointment, deleteAppointment, checkForConflicts } = useAppointments();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: '',
      location_id: '',
      title: '',
      start_time: new Date(),
      end_time: new Date(),
      notes: '',
      recurrence_type: 'none',
    },
  });

  const watchedStartTime = form.watch('start_time');
  const watchedEndTime = form.watch('end_time');

  useEffect(() => {
    if (appointment) {
      // Editing existing appointment
      form.reset({
        patient_id: appointment.patient_id,
        location_id: appointment.location_id,
        title: appointment.title,
        start_time: new Date(appointment.start_time),
        end_time: new Date(appointment.end_time),
        notes: appointment.notes || '',
        recurrence_type: appointment.recurrence_type,
        recurrence_end_date: appointment.recurrence_end_date ? new Date(appointment.recurrence_end_date) : undefined,
      });
    } else if (selectedTimeSlot) {
      // Creating new appointment for specific time slot
      const startTime = addHours(startOfDay(selectedTimeSlot.date), selectedTimeSlot.hour);
      const endTime = addHours(startTime, 1); // Default 1 hour duration
      
      form.reset({
        patient_id: '',
        location_id: locations[0]?.id || '',
        title: '',
        start_time: startTime,
        end_time: endTime,
        notes: '',
        recurrence_type: 'none',
      });
    } else {
      // Creating new appointment without specific time
      const now = new Date();
      const startTime = new Date(now);
      startTime.setMinutes(0, 0, 0); // Round to nearest hour
      const endTime = addHours(startTime, 1);
      
      form.reset({
        patient_id: '',
        location_id: locations[0]?.id || '',
        title: '',
        start_time: startTime,
        end_time: endTime,
        notes: '',
        recurrence_type: 'none',
      });
    }
  }, [appointment, selectedTimeSlot, locations, form]);

  useEffect(() => {
    if (watchedStartTime && watchedEndTime) {
      const foundConflicts = checkForConflicts(
        watchedStartTime,
        watchedEndTime,
        appointment?.id
      );
      setConflicts(foundConflicts);
    }
  }, [watchedStartTime, watchedEndTime, appointment?.id, checkForConflicts]);

  const onSubmit = async (data: z.infer<typeof appointmentSchema>) => {
    try {
      if (appointment) {
        await updateAppointment(appointment.id, data as AppointmentFormData);
      } else {
        await createAppointment(data as AppointmentFormData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleDelete = async () => {
    if (appointment && confirm('Tem certeza que deseja excluir este agendamento?')) {
      await deleteAppointment(appointment.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        {conflicts.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Atenção: Existe(m) {conflicts.length} conflito(s) de horário com outros agendamentos.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Paciente
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Local
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um local" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} {location.address && `- ${location.address}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Consulta de retorno" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Data e Hora de Início
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        placeholder="Selecione a data"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e Hora de Término</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        placeholder="Selecione a data"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="recurrence_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recorrência</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem recorrência</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('recurrence_type') !== 'none' && (
              <FormField
                control={form.control}
                name="recurrence_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Final da Recorrência</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        placeholder="Selecione a data final"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Observações
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <div>
                {appointment && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {appointment ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}