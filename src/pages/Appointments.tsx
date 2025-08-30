import { useEffect, useRef, useState, useMemo } from 'react';
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
  differenceInCalendarDays,
  startOfMonth,
  addMonths,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock, CalendarDays, CalendarRange, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
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
import { MonthSchedule } from '@/components/schedule/MonthSchedule';
import { useSearchParams } from 'react-router-dom';
import {
  composeEffectiveAvailability,
  listExceptions,
  addException,
  removeException,
  updateException,
  CalendarException,
  ExceptionType,
} from '@/domain/calendarExceptions';
export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; hour: number; minute: number; endHour?: number; endMinute?: number } | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showSettings, setShowSettings] = useState(false);
  const [showNonWorkingHours, setShowNonWorkingHours] = useState(false);
  const [exceptions, setExceptions] = useState<CalendarException[]>([]);
  const [showExceptionSheet, setShowExceptionSheet] = useState(false);
  const [exceptionType, setExceptionType] = useState<ExceptionType>('BLACKOUT');
  const [exceptionStart, setExceptionStart] = useState('');
  const [exceptionEnd, setExceptionEnd] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [editingExceptionId, setEditingExceptionId] = useState<string | null>(null);
  const reasonOptions = ['Feriado', 'Reunião', 'Manutenção'];

  const { toast } = useToast();

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
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = getWeekDays(currentDate);
  const currentMonth = startOfMonth(currentDate);
  const baseHours = {
    start: Number(organizationSettings?.working_hours_start ?? 8),
    end: Number(organizationSettings?.working_hours_end ?? 18),
  };
  const workingHours = weekDays.reduce((acc, day) => {
    const eff = composeEffectiveAvailability(day, baseHours, exceptions) ?? baseHours;
    return { start: Math.min(acc.start, eff.start), end: Math.max(acc.end, eff.end) };
  }, { ...baseHours }); // disponibilidade efetiva: padrão + exceções
  const [scrollTargetHour, setScrollTargetHour] = useState(8);
  const [searchParams, setSearchParams] = useSearchParams();
  const scheduleRef = useRef<HTMLDivElement>(null);
  const firstHourRef = useRef<HTMLDivElement>(null);
  const timeColumnWidth = '3rem';
  const [mobileDays, setMobileDays] = useState(1);

  useEffect(() => {
    listExceptions().then(setExceptions);
  }, []);

  useEffect(() => {
    const calculateMobileDays = () => {
      if (!isMobile) {
        setMobileDays(7);
        return;
      }
      const TIME_COLUMN_WIDTH_PX = 48; // 3rem
      const MIN_DAY_WIDTH_PX = 120;
      const availableWidth = window.innerWidth - TIME_COLUMN_WIDTH_PX;
      const days = Math.max(
        1,
        Math.min(7, Math.floor(availableWidth / MIN_DAY_WIDTH_PX))
      );
      setMobileDays(days);
    };
    calculateMobileDays();
    window.addEventListener('resize', calculateMobileDays);
    return () => window.removeEventListener('resize', calculateMobileDays);
  }, [isMobile]);

  useEffect(() => {
    if (selectedDayIndex + mobileDays > 7) {
      setSelectedDayIndex(Math.max(0, 7 - mobileDays));
    }
  }, [mobileDays, selectedDayIndex]);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      setCurrentDate(parsedDate);
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

  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId');
    if (appointmentId && appointments.length > 0) {
      const appt = appointments.find(a => a.id === appointmentId);
      if (appt) {
        setSelectedAppointment(appt);
        setIsModalOpen(true);
        const params = new URLSearchParams(searchParams);
        params.delete('appointmentId');
        setSearchParams(params);
      }
    }
  }, [searchParams, appointments, setSearchParams]);

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

  const handleDayLongPress = (date: Date) => {
    setShowExceptionSheet(true);
    setExceptionReason('');
    const start = new Date(date);
    const end = new Date(date);
    if (isWeekend(date)) {
      setExceptionType('EXTRA_OPEN');
      start.setHours(9, 0, 0, 0);
      end.setHours(12, 0, 0, 0);
    } else {
      setExceptionType('DAY_ADJUST');
      const startHour = Number(organizationSettings?.working_hours_start ?? 8);
      const endHour = Number(organizationSettings?.working_hours_end ?? 18);
      start.setHours(startHour, 0, 0, 0);
      end.setHours(endHour, 0, 0, 0);
    }
    setExceptionStart(format(start, "yyyy-MM-dd'T'HH:mm"));
    setExceptionEnd(format(end, "yyyy-MM-dd'T'HH:mm"));
  };

  const resetExceptionForm = () => {
    setExceptionStart('');
    setExceptionEnd('');
    setExceptionReason('');
    setExceptionType('BLACKOUT');
    setEditingExceptionId(null);
  };

  const handleSaveException = async () => {
    if (!exceptionStart || !exceptionEnd) return;
    const exc: CalendarException = {
      id: editingExceptionId ?? crypto.randomUUID(),
      type: exceptionType,
      dateStart: new Date(exceptionStart).toISOString(),
      dateEnd: new Date(exceptionEnd).toISOString(),
      reason: exceptionReason,
      createdAt: new Date().toISOString(),
      createdBy: user?.id,
    };
    if (editingExceptionId) {
      await updateException(exc);
      setExceptions((prev) => prev.map((e) => (e.id === exc.id ? exc : e)));
      toast({ title: 'Exceção atualizada' });
    } else {
      await addException(exc);
      setExceptions([...exceptions, exc]);
      toast({
        title: 'Exceção aplicada',
        action: (
          <ToastAction
            altText="Desfazer"
            onClick={async () => {
              await removeException(exc.id);
              setExceptions((prev) => prev.filter((e) => e.id !== exc.id));
            }}
          >
            Desfazer
          </ToastAction>
        ),
      });
    }
    setShowExceptionSheet(false);
    resetExceptionForm();
  };

  const handleEditException = (exc: CalendarException) => {
    setEditingExceptionId(exc.id);
    setExceptionType(exc.type);
    setExceptionStart(format(new Date(exc.dateStart), "yyyy-MM-dd'T'HH:mm"));
    setExceptionEnd(format(new Date(exc.dateEnd), "yyyy-MM-dd'T'HH:mm"));
    setExceptionReason(exc.reason || '');
    setShowExceptionSheet(true);
  };

  const handleDeleteException = async (id: string) => {
    await removeException(id);
    setExceptions((prev) => prev.filter((e) => e.id !== id));
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
      const prevWeek = subWeeks(currentDate, 1);
      setCurrentDate(prevWeek);
      setSelectedDayIndex(7 - mobileDays);
    } else {
      setSelectedDayIndex(selectedDayIndex - 1);
    }
  };

  const handleNextDay = () => {
    if (selectedDayIndex + mobileDays >= weekDays.length) {
      const nextWeek = addWeeks(currentDate, 1);
      setCurrentDate(nextWeek);
      setSelectedDayIndex(0);
    } else {
      setSelectedDayIndex(selectedDayIndex + 1);
    }
  };
  const daysToDisplay = isMobile ? weekDays.slice(selectedDayIndex, selectedDayIndex + mobileDays) : weekDays;

  const dayAvailability = useMemo(
    () => daysToDisplay.map((day) => composeEffectiveAvailability(day, baseHours, exceptions)),
    [daysToDisplay, baseHours.start, baseHours.end, exceptions]
  );

  const hasAfterHoursAppointments = useMemo(() =>
    appointments.some((a) =>
      daysToDisplay.some((day) => {
        const dayStart = startOfDay(day).getTime();
        const dayEnd = addDays(startOfDay(day), 1).getTime();
        const eff = composeEffectiveAvailability(day, baseHours, exceptions) ?? baseHours;
        const workStart = dayStart + eff.start * 60 * 60 * 1000;
        const workEnd = dayStart + eff.end * 60 * 60 * 1000;
        const apptStart = new Date(a.start_time).getTime();
        const apptEnd = new Date(a.end_time).getTime();
        const intersectsDay = apptEnd > dayStart && apptStart < dayEnd;
        if (!intersectsDay) return false;
        return apptStart < workStart || apptEnd > workEnd;
      })
    ),
    [appointments, daysToDisplay, baseHours.start, baseHours.end, exceptions]
  );

  const weekRange = `${format(weekStart, "d 'de' MMMM", { locale: ptBR })} - ${format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  const monthLabel = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });
  const headerDate = viewMode === 'month'
    ? monthLabel
    : isMobile
      ? `${format(daysToDisplay[0], "d 'de' MMM", { locale: ptBR })} - ${format(daysToDisplay[daysToDisplay.length - 1], "d 'de' MMM", { locale: ptBR })}`
      : weekRange;

  const topBarNavigation = (
    <div className="flex items-center gap-2">
      {viewMode === 'month' ? (
        <>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>{headerDate}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      ) : isMobile ? (
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
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>{headerDate}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
      >
        {viewMode === 'week' ? (
          <CalendarDays className="w-4 h-4" />
        ) : (
          <CalendarRange className="w-4 h-4" />
        )}
      </Button>
      {viewMode === 'week' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNonWorkingHours(!showNonWorkingHours)}
          className="relative"
        >
          <Clock className="w-4 h-4" />
          {hasAfterHoursAppointments && !showNonWorkingHours && (
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      )}
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            resetExceptionForm();
            setShowExceptionSheet(true);
          }}
          aria-label="Adicionar exceção"
          className="w-11 h-11"
        >
          <Plus className="w-4 h-4" />
        </Button>
      )}
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
              {viewMode === 'week' ? (
                <>
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
                    dayAvailability={dayAvailability}
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
                </>
              ) : (
                <MonthSchedule
                  currentMonth={currentMonth}
                  appointments={appointments}
                  patients={patients}
                  exceptions={exceptions}
                  onDayLongPress={handleDayLongPress}
                  onDayClick={(date) => {
                    setCurrentDate(date);
                    const start = startOfWeek(date, { weekStartsOn: 1 });
                    const index = differenceInCalendarDays(date, start);
                    setSelectedDayIndex(index);
                    setViewMode('week');
                  }}
                />
              )}
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
          organizationId={userProfile?.organization_id}
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
        {isMobile && (
          <Button
            className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg"
            onClick={() => {
              resetExceptionForm();
              setShowExceptionSheet(true);
            }}
            aria-label="Adicionar exceção"
          >
            <Plus className="w-6 h-6" />
          </Button>
        )}
        <Drawer open={showExceptionSheet} onOpenChange={setShowExceptionSheet}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Gerenciar exceções</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {exceptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma exceção cadastrada.</p>
                )}
                {exceptions.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between border rounded-md p-2"
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">
                        {ex.type === 'BLACKOUT'
                          ? 'Fechamento'
                          : ex.type === 'EXTRA_OPEN'
                          ? 'Abertura extra'
                          : 'Ajuste de expediente'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(ex.dateStart), 'dd/MM/yyyy HH:mm')} -
                        {' '}
                        {format(new Date(ex.dateEnd), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditException(ex)}
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteException(ex.id)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">
                    {editingExceptionId ? 'Editar exceção' : 'Nova exceção'}
                  </h3>
                  {editingExceptionId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetExceptionForm}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={exceptionType} onValueChange={(v) => setExceptionType(v as ExceptionType)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BLACKOUT">Fechamento</SelectItem>
                      <SelectItem value="EXTRA_OPEN">Abertura extra</SelectItem>
                      <SelectItem value="DAY_ADJUST">Ajuste de expediente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div>
                    <label className="text-sm font-medium">Início</label>
                    <Input
                      type="datetime-local"
                      value={exceptionStart}
                      onChange={(e) => setExceptionStart(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fim</label>
                    <Input
                      type="datetime-local"
                      value={exceptionEnd}
                      onChange={(e) => setExceptionEnd(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1">Motivo</label>
                  <div className="flex gap-2 flex-wrap">
                    {reasonOptions.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setExceptionReason(r)}
                        className={cn(
                          badgeVariants({ variant: exceptionReason === r ? 'default' : 'outline' }),
                          'px-4 py-2'
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DrawerFooter>
              <Button
                onClick={handleSaveException}
                className="w-full h-11"
                disabled={!exceptionStart || !exceptionEnd}
              >
                {editingExceptionId ? 'Atualizar' : 'Salvar'}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </AppNavigation>
  );
}