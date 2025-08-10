import { useEffect, useRef, useState } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  startOfDay,
  addHours,
  isSameDay,
  isWeekend
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentModal } from '@/components/AppointmentModal';
import { Appointment } from '@/types/appointment';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SettingsModal } from '@/components/SettingsModal';
import { UserAvatar } from '@/components/UserAvatar';
import { AppNavigation } from '@/components/AppNavigation';
import { useAuth as useSupabaseAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useSupabasePatients } from '@/hooks/useSupabasePatients';
import { WeekSchedule } from '@/components/schedule/WeekSchedule';

export default function Appointments() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; hour: number; minute: number; endHour?: number; endMinute?: number } | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showSettings, setShowSettings] = useState(false);
  const [showNonWorkingHours, setShowNonWorkingHours] = useState(false);

  const { user, loading: authLoading, signOut } = useSupabaseAuth();
  const {
    userProfile,
    organizationSettings,
    loading: orgLoading,
    updateProfile,
    updateOrganizationSettings
  } = useOrganization(user);

  const {
    patients,
    addPatient,
    deletePatient,
    bulkAddPatients,
    bulkDeletePatients,
    retryLoadPatients,
  } = useSupabasePatients(userProfile?.organization_id);

  const {
    appointments,
    locations,
    titles,
    loading: appointmentsLoading,
    fetchLocations,
    fetchTitles,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    checkForConflicts,
  } = useAppointments();
  const getWeekDays = (week: Date) => {
    const start = startOfWeek(week, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = getWeekDays(currentWeek);
  const filteredWeekDays = weekDays.filter(day => !isWeekend(day));
  const allHours = Array.from({ length: 96 }, (_, i) => i / 4); // 15 min increments
  const workingHours = {
    start: Number(organizationSettings?.working_hours_start ?? 9),
    end: Number(organizationSettings?.working_hours_end ?? 18),
  };
  const scrollTargetHour = 8; // Scroll to 8:00 on load
  const scheduleRef = useRef<HTMLDivElement>(null);
  const firstHourRef = useRef<HTMLDivElement>(null);

  const getAppointmentsForTimeSlot = (date: Date, hour: number) => {
    const slotStart = addHours(startOfDay(date), hour);
    const slotEnd = addHours(slotStart, 0.25); // 15 minutes slots

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
    const fullHour = Math.floor(hour);
    const minute = Math.round((hour % 1) * 60);
    setSelectedTimeSlot({ date, hour: fullHour, minute });
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleTimeRangeSelect = (
    date: Date,
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number
  ) => {
    setSelectedTimeSlot({ date, hour: startHour, minute: startMinute, endHour, endMinute });
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
    const minutes = Math.round((hour % 1) * 60);
    return `${fullHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const todayIndex = filteredWeekDays.findIndex(day => isSameDay(day, new Date()));
    if (todayIndex !== -1) {
      setSelectedDayIndex(todayIndex);
    } else {
      setSelectedDayIndex(0);
    }
  }, [currentWeek, filteredWeekDays]);

  useEffect(() => {
    if (scheduleRef.current && firstHourRef.current) {
      scheduleRef.current.scrollTop = firstHourRef.current.offsetTop;
    }
  }, []);

  const handlePrevDay = () => {
    if (selectedDayIndex === 0) {
      const prevWeek = subWeeks(currentWeek, 1);
      const prevWeekDays = getWeekDays(prevWeek).filter(day => !isWeekend(day));
      setCurrentWeek(prevWeek);
      setSelectedDayIndex(prevWeekDays.length - 1);
    } else {
      setSelectedDayIndex(selectedDayIndex - 1);
    }
  };

  const handleNextDay = () => {
    if (selectedDayIndex === filteredWeekDays.length - 1) {
      const nextWeek = addWeeks(currentWeek, 1);
      setCurrentWeek(nextWeek);
      setSelectedDayIndex(0);
    } else {
      setSelectedDayIndex(selectedDayIndex + 1);
    }
  };
  const daysToDisplay = isMobile ? [filteredWeekDays[selectedDayIndex]] : filteredWeekDays;

  if (appointmentsLoading || authLoading || orgLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <AppNavigation
      userProfile={userProfile}
      onSettingsClick={() => setShowSettings(true)}
      onSignOut={signOut}
    >
      <div className="flex flex-col gap-2 h-[calc(100vh-4rem)] overflow-hidden">

        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-dental-primary">Agendamentos</h1>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setSelectedAppointment(null);
                setSelectedTimeSlot(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNonWorkingHours(!showNonWorkingHours)}
            >
              <Clock className="w-4 h-4 mr-1" />
              {showNonWorkingHours ? 'Ocultar horários não úteis' : 'Mostrar horários não úteis'}
            </Button>
          </div>
        </div>

        {/* Week/Day Navigation */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="px-2 py-2 md:px-4 md:py-4">
            <div className="hidden md:flex items-center justify-between">
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
          <div className="flex md:hidden items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevDay}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg">
              {format(filteredWeekDays[selectedDayIndex], "EEE, d 'de' MMMM", { locale: ptBR })}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleNextDay}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          {/* Header with days */}
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-8'} gap-0 border rounded-t-lg overflow-hidden`}>
            <div className="bg-muted p-2 border-r text-center">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            {daysToDisplay.map((day) => {
              const weekend = isWeekend(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`${weekend ? 'bg-muted/20 text-muted-foreground/50' : 'bg-muted'} p-2 border-r text-center`}
                >
                  <div className="font-medium">{format(day, 'EEEEEE', { locale: ptBR })}</div>
                  <div className={`text-sm ${weekend ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>{format(day, 'd')}</div>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          <WeekSchedule
            isMobile={isMobile}
            daysToDisplay={daysToDisplay}
            workingHours={workingHours}
            appointments={appointments}
            onTimeSlotClick={handleTimeSlotClick}
            onTimeRangeSelect={handleTimeRangeSelect}
            onAppointmentClick={handleAppointmentClick}
            getLocationColor={getLocationColor}
            scheduleRef={scheduleRef}
            firstHourRef={firstHourRef}
            scrollTargetHour={showNonWorkingHours ? scrollTargetHour : workingHours.start}
            showNonWorkingHours={showNonWorkingHours}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 py-2">
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

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        selectedTimeSlot={selectedTimeSlot}
        locations={locations}
        titles={titles}
        patients={patients}
        addPatient={addPatient}
        retryLoadPatients={retryLoadPatients}
        createAppointment={createAppointment}
        updateAppointment={updateAppointment}
        deleteAppointment={deleteAppointment}
        checkForConflicts={checkForConflicts}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userProfile={userProfile}
        organizationSettings={organizationSettings}
        patients={patients}
        onUpdateProfile={updateProfile}
        onUpdateSettings={updateOrganizationSettings}
        onBulkImport={bulkAddPatients}
        onDeletePatient={deletePatient}
        onBulkDelete={bulkDeletePatients}
        fetchLocations={fetchLocations}
        fetchTitles={fetchTitles}
      />
      </div>
    </AppNavigation>
  );
}