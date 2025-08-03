import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addHours, startOfDay, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Clock, MapPin, User, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { useAppointments } from '@/hooks/useAppointments';
import { Appointment, Location, AppointmentFormData } from '@/types/appointment';
import { Patient } from '@/types/patient';

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Selecione um paciente'),
  location_id: z.string().min(1, 'Selecione um local'),
  title: z.string().min(1, 'Digite um título'),
  date: z.date(),
  start_hour: z.number().min(0).max(23),
  start_minute: z.number().min(0).max(59),
  end_hour: z.number().min(0).max(23),
  end_minute: z.number().min(0).max(59),
  notes: z.string().optional(),
  recurrence_type: z.enum(['none', 'monthly', 'semiannual', 'annual']),
  recurrence_end_date: z.date().optional(),
});

const titleOptions = [
  'Consulta de Retorno',
  'Primeira Consulta', 
  'Manutenção'
];

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
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const navigate = useNavigate();
  const { createAppointment, updateAppointment, deleteAppointment, checkForConflicts } = useAppointments();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: '',
      location_id: '',
      title: 'Consulta de Retorno',
      date: new Date(),
      start_hour: 9,
      start_minute: 0,
      end_hour: 10,
      end_minute: 0,
      notes: '',
      recurrence_type: 'none',
    },
  });

  const watchedDate = form.watch('date');
  const watchedStartHour = form.watch('start_hour');
  const watchedStartMinute = form.watch('start_minute');
  const watchedEndHour = form.watch('end_hour');
  const watchedEndMinute = form.watch('end_minute');

  useEffect(() => {
    if (appointment) {
      // Editing existing appointment
      const startTime = new Date(appointment.start_time);
      const endTime = new Date(appointment.end_time);
      
      form.reset({
        patient_id: appointment.patient_id,
        location_id: appointment.location_id,
        title: appointment.title,
        date: startTime,
        start_hour: startTime.getHours(),
        start_minute: startTime.getMinutes(),
        end_hour: endTime.getHours(),
        end_minute: endTime.getMinutes(),
        notes: appointment.notes || '',
        recurrence_type: appointment.recurrence_type,
        recurrence_end_date: appointment.recurrence_end_date ? new Date(appointment.recurrence_end_date) : undefined,
      });
      const patientName = patients.find((p) => p.id === appointment.patient_id)?.name || '';
      setPatientSearch(patientName);
    } else if (selectedTimeSlot) {
      // Creating new appointment for specific time slot
      form.reset({
        patient_id: '',
        location_id: locations[0]?.id || '',
        title: 'Consulta de Retorno',
        date: selectedTimeSlot.date,
        start_hour: selectedTimeSlot.hour,
        start_minute: 0,
        end_hour: selectedTimeSlot.hour + 1,
        end_minute: 0,
        notes: '',
        recurrence_type: 'none',
      });
      setPatientSearch('');
    } else {
      // Creating new appointment without specific time
      const now = new Date();
      
      form.reset({
        patient_id: '',
        location_id: locations[0]?.id || '',
        title: 'Consulta de Retorno',
        date: now,
        start_hour: 9,
        start_minute: 0,
        end_hour: 10,
        end_minute: 0,
        notes: '',
        recurrence_type: 'none',
      });
      setPatientSearch('');
    }
  }, [appointment, selectedTimeSlot, locations, patients, form]);

  useEffect(() => {
    if (watchedDate && watchedStartHour !== undefined && watchedStartMinute !== undefined && 
        watchedEndHour !== undefined && watchedEndMinute !== undefined) {
      const startTime = setMinutes(setHours(watchedDate, watchedStartHour), watchedStartMinute);
      const endTime = setMinutes(setHours(watchedDate, watchedEndHour), watchedEndMinute);
      
      const foundConflicts = checkForConflicts(
        startTime,
        endTime,
        appointment?.id
      );
      setConflicts(foundConflicts);
    }
  }, [watchedDate, watchedStartHour, watchedStartMinute, watchedEndHour, watchedEndMinute, appointment?.id, checkForConflicts]);

  const onSubmit = async (data: z.infer<typeof appointmentSchema>) => {
    try {
      const startTime = setMinutes(setHours(data.date, data.start_hour), data.start_minute);
      const endTime = setMinutes(setHours(data.date, data.end_hour), data.end_minute);
      
      const appointmentData: AppointmentFormData = {
        patient_id: data.patient_id,
        location_id: data.location_id,
        title: data.title,
        start_time: startTime,
        end_time: endTime,
        notes: data.notes,
        recurrence_type: data.recurrence_type,
        recurrence_end_date: data.recurrence_end_date,
      };
      
      if (appointment) {
        await updateAppointment(appointment.id, appointmentData);
      } else {
        await createAppointment(appointmentData);
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
                render={({ field }) => {
                  const filteredPatients = patients.filter((patient) =>
                    patient.name.toLowerCase().includes(patientSearch.toLowerCase())
                  );
                  return (
                    <FormItem className="relative">
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Paciente
                      </FormLabel>
                      <Popover
                        open={patientSearchOpen}
                        onOpenChange={setPatientSearchOpen}
                        modal={false}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Input
                              placeholder="Digite para buscar..."
                              value={
                                field.value
                                  ? patients.find((p) => p.id === field.value)?.name || ''
                                  : patientSearch
                              }
                              onChange={(e) => {
                                setPatientSearch(e.target.value);
                                field.onChange('');
                                setPatientSearchOpen(true);
                              }}
                              onFocus={() => setPatientSearchOpen(true)}
                            />
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 z-[60]">
                          <Command>
                            <CommandList>
                              {filteredPatients.length > 0 ? (
                                <CommandGroup>
                                  {filteredPatients.map((patient) => (
                                    <CommandItem
                                      key={patient.id}
                                      value={`${patient.name} ${patient.phone}`}
                                      onSelect={() => {
                                        field.onChange(patient.id);
                                        setPatientSearch(patient.name);
                                        setPatientSearchOpen(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{patient.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                          {patient.phone}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ) : (
                                <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                              )}
                              <CommandSeparator />
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => {
                                    onClose();
                                    navigate('/?action=add-patient');
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Adicionar novo paciente
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {titleOptions.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Data do Agendamento
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Horário de Início</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="start_hour"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Hora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}
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
                    name="start_minute"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[0, 15, 30, 45].map((minute) => (
                              <SelectItem key={minute} value={minute.toString()}>
                                {minute.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div>
                <FormLabel>Horário de Término</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="end_hour"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Hora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}
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
                    name="end_minute"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[0, 15, 30, 45].map((minute) => (
                              <SelectItem key={minute} value={minute.toString()}>
                                {minute.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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