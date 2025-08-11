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
  isWeekend,
  differenceInCalendarDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentModal } from '@/components/AppointmentModal';
import { Appointment } from '@/types/appointment';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SettingsModal } from '@/components/SettingsModal';
import { AppNavigation } from '@/components/AppNavigation';
import { useAuth as useSupabaseAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useSupabasePatients } from '@/hooks/useSupabasePatients';
import { WeekSchedule } from '@/components/schedule/WeekSchedule';
import { useSearchParams } from 'react-router-dom';

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
  const workingHours = {
    start: Number(organizationSettings?.working_hours_start ?? 8),
    end: Number(organizationSettings?.working_hours_end ?? 18),
  };
  const [scrollTargetHour, setScrollTargetHour] = useState(8);
  const [searchParams] = useSearchParams();
  const scheduleRef = useRef<HTMLDivElement>(null);
  const firstHourRef = useRef<HTMLDivElement>(null);
  const timeColumnWidth = '3rem';

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      setCurrentWeek(parsedDate);
      const start = startOfWeek(parsedDate, { weekStartsOn: 1 });
      const index = differenceInCalendarDays(parsedDate, start);
      setSelectedDayIndex(index);
    }
    const hourParam = searchParams.get('hour');
    if (hourParam) {
      const h = parseInt(hourParam, 10);
      setScrollTargetHour(h);
      if (h < workingHours.start || h >= workingHours.end) {
        setShowNonWorkingHours(true);
      }
    }
  }, [searchParams, workingHours.start, workingHours.end]);

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

  useEffect(() => {
    const todayIndex = weekDays.findIndex(day => isSameDay(day, new Date()));
    setSelectedDayIndex(todayIndex !== -1 ? todayIndex : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scheduleRef.current && firstHourRef.current) {
      scheduleRef.current.scrollTop = firstHourRef.current.offsetTop;
    }
  }, [showNonWorkingHours, workingHours.start]);

  const handlePrevDay = () => {
    if (selectedDayIndex === 0) {
      const prevWeek = subWeeks(currentWeek, 1);
      setCurrentWeek(prevWeek);
      setSelectedDayIndex(weekDays.length - 1);
    } else {
      setSelectedDayIndex(selectedDayIndex - 1);
    }
  };

  const handleNextDay = () => {
    if (selectedDayIndex === weekDays.length - 1) {
      const nextWeek = addWeeks(currentWeek, 1);
      setCurrentWeek(nextWeek);
      setSelectedDayIndex(0);
    } else {
      setSelectedDayIndex(selectedDayIndex + 1);
    }
  };
  const daysToDisplay = isMobile ? [weekDays[selectedDayIndex]] : weekDays;

  const weekRange = `${format(weekStart, "d 'de' MMMM", { locale: ptBR })} - ${format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  const headerDate = isMobile
    ? format(weekDays[selectedDayIndex], "EEE, d 'de' MMMM", { locale: ptBR })
    : weekRange;

  const topBarNavigation = (
    <div className="flex items-center gap-2">
      {isMobile ? (
        <>
          <Button variant="ghost" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>{headerDate}</span>
          <Button variant="ghost" size="icon" onClick={handleNextDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>{headerDate}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowNonWorkingHours(!showNonWorkingHours)}
      >
        <Clock className="w-4 h-4" />
      </Button>
    </div>
  );

  if (appointmentsLoading || authLoading || orgLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <AppNavigation
      userProfile={userProfile}
      onSettingsClick={() => setShowSettings(true)}
      onSignOut={signOut}
      topBarContent={topBarNavigation}
      contentClassName="p-0"
    >
      <div className="flex flex-col gap-2 h-[calc(100vh-4rem)] overflow-hidden">
        <Card className="flex-1 flex flex-col min-h-0">
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div ref={scheduleRef} className="h-full overflow-y-auto">
              {/* Header with days */}
              <div
                className="sticky top-0 z-10 grid gap-0 border rounded-t-lg overflow-hidden"
                style={{ gridTemplateColumns: `${timeColumnWidth} repeat(${daysToDisplay.length}, 1fr)` }}
              >
                <div className="bg-muted p-2 border-r text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedAppointment(null);
                      setSelectedTimeSlot(null);
                      setIsModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
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
                firstHourRef={firstHourRef}
                scrollTargetHour={scrollTargetHour}
                showNonWorkingHours={showNonWorkingHours}
                timeColumnWidth={timeColumnWidth}
              />
            </div>
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
          organizationSettings={organizationSettings}
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