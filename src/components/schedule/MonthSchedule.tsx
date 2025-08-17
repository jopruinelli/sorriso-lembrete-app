import { useRef } from 'react';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWeekend,
  setYear,
  startOfMonth,
  startOfWeek,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/types/appointment';
import { Patient } from '@/types/patient';
import { CalendarException } from '@/domain/calendarExceptions';
import { Button } from '@/components/ui/button';
import { Cake, Calendar } from 'lucide-react';

interface MonthScheduleProps {
  currentMonth: Date;
  appointments: Appointment[];
  patients: Patient[];
  exceptions: CalendarException[];
  onDayClick: (date: Date) => void;
  onDayLongPress?: (date: Date) => void;
}

export function MonthSchedule({ currentMonth, appointments, patients, exceptions, onDayClick, onDayLongPress }: MonthScheduleProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  for (let day = startDate; day <= endDate; day = addDays(day, 1)) {
    days.push(day);
  }

  const weekDayNames = Array.from({ length: 7 }, (_, i) =>
    format(addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), i), 'EEEEEE', {
      locale: ptBR,
    })
  );

  const year = currentMonth.getFullYear();

  const hasAppointment = (day: Date) =>
    appointments.some((a) => isSameDay(new Date(a.start_time), day));

  const hasBirthday = (day: Date) =>
    patients.some((p) => p.birthDate && isSameDay(setYear(p.birthDate, year), day));

  const hasException = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = addDays(dayStart, 1);
    return exceptions.some((ex) => {
      const exStart = new Date(ex.dateStart);
      const exEnd = new Date(ex.dateEnd);
      return exEnd > dayStart && exStart < dayEnd;
    });
  };

  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 text-center text-xs font-medium">
        {weekDayNames.map((name) => (
          <div key={name} className="p-2">
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthStart);
          const appt = hasAppointment(day);
          const birthday = hasBirthday(day);
          const exception = hasException(day);
          const weekend = isWeekend(day);
          const hatched = weekend || exception;
          return (
            <Button
              key={day.toISOString()}
              variant="ghost"
              className={`relative h-16 sm:h-24 p-1 sm:p-2 flex flex-col items-start gap-1 rounded-none border ${
                inMonth ? 'bg-background' : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => onDayClick(day)}
              onPointerDown={() => {
                if (onDayLongPress) {
                  longPressTimer.current = setTimeout(() => onDayLongPress(day), 500);
                }
              }}
              onPointerUp={clearLongPress}
              onPointerLeave={clearLongPress}
              onContextMenu={(e) => {
                e.preventDefault();
                onDayLongPress?.(day);
              }}
            >
              {hatched && <div className="absolute inset-0 bg-hatched pointer-events-none" />}
              <span className="text-xs sm:text-sm">{format(day, 'd')}</span>
              <div className="flex gap-1">
                {appt && <Calendar className="h-3 w-3 text-blue-500" />}
                {birthday && <Cake className="h-3 w-3 text-pink-500" />}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
