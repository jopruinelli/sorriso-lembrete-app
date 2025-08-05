import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfWeek, addDays, addWeeks, subWeeks, startOfDay, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentModal } from '@/components/AppointmentModal';
import { Appointment } from '@/types/appointment';

export default function Appointments() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; hour: number } | null>(null);

  const { appointments, locations, loading } = useAppointments();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const allHours = Array.from({ length: 24 }, (_, i) => i); // 0:00 to 23:00
  const workingHours = { start: 9, end: 18 }; // 9:00 to 18:00

  const getAppointmentsForTimeSlot = (date: Date, hour: number) => {
    const slotStart = addHours(startOfDay(date), hour);
    const slotEnd = addHours(slotStart, 0.5); // 30 minutes slots

    return appointments.filter(appointment => {
      const appointmentStart = new Date(appointment.start_time);
      const appointmentEnd = new Date(appointment.end_time);
      
      return (
        (appointmentStart >= slotStart && appointmentStart < slotEnd) ||
        (appointmentEnd > slotStart && appointmentEnd <= slotEnd) ||
        (appointmentStart <= slotStart && appointmentEnd >= slotEnd)
      );
    });
  };

  const getLocationColor = (locationId: string) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800'];
    const index = locations.findIndex(loc => loc.id === locationId);
    return colors[index % colors.length] || 'bg-gray-100 text-gray-800';
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const slotTime = addHours(startOfDay(date), hour);
    setSelectedTimeSlot({ date, hour });
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedTimeSlot(null);
    setIsModalOpen(true);
  };

  const formatHour = (hour: number) => {
    const fullHour = Math.floor(hour);
    const minutes = (hour % 1) * 60;
    return `${fullHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <Calendar className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Agendamentos</h1>
            <p className="text-muted-foreground">
              Gerencie suas consultas e compromissos
            </p>
          </div>
        </div>
        <Button onClick={() => {
          setSelectedAppointment(null);
          setSelectedTimeSlot(null);
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg">
              {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-0 border rounded-lg overflow-hidden">
            {/* Header with days */}
            <div className="bg-muted p-2 border-r border-b">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="bg-muted p-2 border-r border-b text-center">
                <div className="font-medium">{format(day, 'EEE', { locale: ptBR })}</div>
                <div className="text-sm text-muted-foreground">{format(day, 'd')}</div>
              </div>
            ))}

            {/* Time slots */}
            {allHours.map((hour) => {
              const isWorkingHour = hour >= workingHours.start && hour < workingHours.end;
              return (
                <div key={hour} className="contents">
                  <div className={`p-2 border-r border-b text-xs text-center ${
                    isWorkingHour 
                      ? 'bg-muted/50 text-muted-foreground' 
                      : 'bg-muted/20 text-muted-foreground/50'
                  }`}>
                    {formatHour(hour)}
                  </div>
                  {weekDays.map((day) => {
                    const slotAppointments = getAppointmentsForTimeSlot(day, hour);
                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={`border-r border-b p-1 min-h-[40px] cursor-pointer transition-colors ${
                          isWorkingHour 
                            ? 'hover:bg-muted/30' 
                            : 'bg-muted/10 hover:bg-muted/20 opacity-60'
                        }`}
                        onClick={() => handleTimeSlotClick(day, hour)}
                      >
                        {slotAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="mb-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(appointment);
                            }}
                          >
                            <Badge
                              variant="secondary"
                              className={`text-xs w-full justify-start ${getLocationColor(appointment.location_id)}`}
                            >
                              <div className="truncate">
                                {appointment.patient?.name}
                              </div>
                            </Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
               );
             })}
          </div>
        </CardContent>
      </Card>

      {/* Location Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Locais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {locations.map((location) => (
              <Badge
                key={location.id}
                variant="secondary"
                className={getLocationColor(location.id)}
              >
                {location.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        selectedTimeSlot={selectedTimeSlot}
        locations={locations}
      />
    </div>
  );
}