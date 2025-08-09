import { useMemo, RefObject, useState } from 'react';
import { Appointment } from '@/types/appointment';
import { isWeekend, startOfDay, addDays, format } from 'date-fns';

type WorkingHours = { start: number; end: number };

interface WeekScheduleProps {
  isMobile: boolean;
  daysToDisplay: Date[];
  workingHours: WorkingHours;
  appointments: Appointment[];
  onTimeSlotClick: (date: Date, hour: number) => void;
  onTimeRangeSelect?: (
    date: Date,
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number
  ) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  getLocationColor: (locationId: string) => string;
  scheduleRef: RefObject<HTMLDivElement>;
  firstHourRef: RefObject<HTMLDivElement>;
  scrollTargetHour?: number;
}

// Visual constants
const SLOT_HEIGHT_PX = 40; // each 15-minute slot height (h-10 = 40px)
const SLOTS_PER_HOUR = 4;
const TOTAL_SLOTS = 24 * SLOTS_PER_HOUR; // 96

const formatHour = (hour: number) => {
  const fullHour = Math.floor(hour);
  const minutes = Math.round((hour % 1) * 60);
  return `${fullHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export function WeekSchedule(props: WeekScheduleProps) {
  const {
    isMobile,
    daysToDisplay,
    workingHours,
    appointments,
    onTimeSlotClick,
    onTimeRangeSelect,
    onAppointmentClick,
    getLocationColor,
    scheduleRef,
    firstHourRef,
    scrollTargetHour = 8,
  } = props;

  const slots = useMemo(() => Array.from({ length: TOTAL_SLOTS }, (_, i) => i), []);
  const [drag, setDrag] = useState<{ dayISO: string; startIndex: number; endIndex: number } | null>(null);

  // Helper to compute an absolute block position for an appointment within a day column
  const computeBlock = (appointment: Appointment, day: Date) => {
    const start = new Date(appointment.start_time);
    const end = new Date(appointment.end_time);

    const dayStart = startOfDay(day).getTime();
    const dayEnd = addDays(startOfDay(day), 1).getTime();

    const apptStart = Math.max(start.getTime(), dayStart);
    const apptEnd = Math.min(end.getTime(), dayEnd);

    if (apptEnd <= apptStart) return null;

    const minutesFromDayStart = (apptStart - dayStart) / 60000;
    const durationMinutes = Math.max(15, (apptEnd - apptStart) / 60000);

    const top = (minutesFromDayStart / 15) * SLOT_HEIGHT_PX; // px
    const height = (durationMinutes / 15) * SLOT_HEIGHT_PX - 4; // subtract a tiny gap

    return { top, height };
  };

  return (
    <div ref={scheduleRef} className="h-full overflow-y-auto border border-t-0 rounded-b-lg">
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-8'} gap-0`}>
        {/* Time column */}
        <div className="border-r">
          {slots.map((i) => {
            const hour = i / SLOTS_PER_HOUR;
            const isWorking = hour >= workingHours.start && hour < workingHours.end;
            return (
              <div
                key={i}
                ref={hour === scrollTargetHour ? firstHourRef : undefined}
                className={`h-10 p-2 border-b text-xs text-center ${
                  isWorking ? 'bg-muted/50 text-muted-foreground' : 'bg-muted/20 text-muted-foreground/50'
                }`}
              >
                {formatHour(hour)}
              </div>
            );
          })}
        </div>

        {/* Day columns */}
        {daysToDisplay.map((day) => {
          const weekend = isWeekend(day);
          const dayStart = startOfDay(day).getTime();
          const dayEnd = addDays(startOfDay(day), 1).getTime();

          // Appointments that intersect this day
          const dayAppointments = appointments.filter((a) => {
            const aStart = new Date(a.start_time).getTime();
            const aEnd = new Date(a.end_time).getTime();
            return aEnd > dayStart && aStart < dayEnd;
          });

          return (
            <div key={day.toISOString()} className="relative border-r">
              {/* Background clickable slots with pointer handlers */}
              <div
                className="relative"
                onPointerDown={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  const index = Math.max(0, Math.min(TOTAL_SLOTS - 1, Math.floor(offsetY / SLOT_HEIGHT_PX)));
                  setDrag({ dayISO: day.toISOString(), startIndex: index, endIndex: index });
                  (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!drag || drag.dayISO !== day.toISOString()) return;
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  const index = Math.max(0, Math.min(TOTAL_SLOTS - 1, Math.floor(offsetY / SLOT_HEIGHT_PX)));
                  setDrag({ ...drag, endIndex: index });
                }}
                onPointerUp={() => {
                  if (!drag || drag.dayISO !== day.toISOString()) return;
                  const start = Math.min(drag.startIndex, drag.endIndex);
                  const endExclusive = Math.max(drag.startIndex, drag.endIndex) + 1;
                  const startHour = Math.floor(start / SLOTS_PER_HOUR);
                  const startMinute = (start % SLOTS_PER_HOUR) * 15;
                  let endIndex = Math.min(endExclusive, TOTAL_SLOTS);
                  let endHour = Math.floor(endIndex / SLOTS_PER_HOUR);
                  let endMinute = (endIndex % SLOTS_PER_HOUR) * 15;
                  if (endHour === 24) { endHour = 23; endMinute = 45; }

                  if (endExclusive - start <= 1) {
                    onTimeSlotClick(day, start / SLOTS_PER_HOUR);
                  } else {
                    onTimeRangeSelect?.(day, startHour, startMinute, endHour, endMinute);
                  }
                  setDrag(null);
                }}
                onPointerCancel={() => setDrag(null)}
              >
                {slots.map((i) => {
                  const hour = i / SLOTS_PER_HOUR;
                  const isWorking = hour >= workingHours.start && hour < workingHours.end;
                  const cellClass = weekend || !isWorking ? 'bg-muted/10 hover:bg-muted/20 opacity-60' : 'hover:bg-muted/30';
                  return (
                    <div
                      key={i}
                      className={`h-10 border-b p-1 cursor-pointer transition-colors ${cellClass}`}
                    />
                  );
                })}

                {/* Drag selection overlay (below appointments) */}
                {drag && drag.dayISO === day.toISOString() && (
                  <div className="pointer-events-none absolute inset-0">
                    {(() => {
                      const start = Math.min(drag.startIndex, drag.endIndex);
                      const endExclusive = Math.max(drag.startIndex, drag.endIndex) + 1;
                      const top = start * SLOT_HEIGHT_PX;
                      const height = (endExclusive - start) * SLOT_HEIGHT_PX;
                      return (
                        <div
                          className="absolute left-1 right-1 rounded-md border border-primary/30 bg-primary/20"
                          style={{ top, height }}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Overlay continuous appointment blocks */}
              <div className="pointer-events-none absolute inset-0">
                {dayAppointments.map((appointment) => {
                  const block = computeBlock(appointment, day);
                  if (!block) return null;

                  return (
                    <div
                      key={appointment.id}
                      className={`pointer-events-auto absolute left-1 right-1 rounded-md border shadow-sm bg-secondary text-secondary-foreground ${getLocationColor(appointment.location_id)}`}
                      style={{ top: block.top, height: block.height }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appointment);
                      }}
                      title={appointment.patient?.name ?? ''}
                    >
                      {(() => {
                        const start = new Date(appointment.start_time);
                        const end = new Date(appointment.end_time);
                        const timesLabel = `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
                        const fullName = appointment.patient?.name ?? "";
                        const parts = fullName.trim().split(/\s+/);
                        const shortName = parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : (parts[0] || "");
                        const isCompact = (block.height as number) < (SLOT_HEIGHT_PX * 1.5);
                        return (
                          <div className="px-2 py-1 text-[10px] sm:text-xs leading-tight">
                            {isCompact ? (
                              <div className="font-medium truncate">{timesLabel} • {shortName}</div>
                            ) : (
                              <>
                                <div className="font-semibold">{timesLabel}</div>
                                <div className="truncate" title={fullName}>{fullName}</div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
