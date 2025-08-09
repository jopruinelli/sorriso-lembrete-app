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
  showNonWorkingHours?: boolean;
}

// Visual constants
const SLOTS_PER_HOUR = 4;
const HOUR_HEIGHT_PX = 48; // each hour cell height (h-12 = 48px)
const SLOT_HEIGHT_PX = HOUR_HEIGHT_PX / SLOTS_PER_HOUR; // height per 15-minute slice
const TOTAL_HOURS = 24;
const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR; // 96 quarter-hour slices
const HOLD_DELAY_MS = 300;

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
    showNonWorkingHours = false,
  } = props;

  const hours = useMemo(() => Array.from({ length: TOTAL_HOURS }, (_, i) => i), []);
  const renderStartHour = showNonWorkingHours ? 0 : workingHours.start;
  const renderEndHour = showNonWorkingHours ? TOTAL_HOURS : workingHours.end;
  const renderHours = hours.slice(renderStartHour, renderEndHour);

  const renderStartSlot = renderStartHour * SLOTS_PER_HOUR;
  const renderEndSlot = renderEndHour * SLOTS_PER_HOUR;
  const totalRenderedSlots = renderHours.length * SLOTS_PER_HOUR;
  const [drag, setDrag] = useState<
    { dayISO: string; startIndex: number; endIndex: number; startTime: number } | null
  >(null);

  // Helper to compute an absolute block position for an appointment within a day column
  const computeBlock = (appointment: Appointment, day: Date) => {
    const start = new Date(appointment.start_time);
    const end = new Date(appointment.end_time);

    const dayStart = startOfDay(day).getTime();
    const dayEnd = addDays(startOfDay(day), 1).getTime();
    const workStart = dayStart + workingHours.start * 60 * 60 * 1000;
    const workEnd = dayStart + workingHours.end * 60 * 60 * 1000;

    const startLimit = showNonWorkingHours ? dayStart : workStart;
    const endLimit = showNonWorkingHours ? dayEnd : workEnd;

    const apptStart = Math.max(start.getTime(), startLimit);
    const apptEnd = Math.min(end.getTime(), endLimit);

    if (apptEnd <= apptStart) return null;

    const minutesFromStart = (apptStart - startLimit) / 60000;
    const durationMinutes = Math.max(15, (apptEnd - apptStart) / 60000);

    const top = (minutesFromStart / 15) * SLOT_HEIGHT_PX; // px
    const height = (durationMinutes / 15) * SLOT_HEIGHT_PX - 2; // subtract a tiny gap

    return { top, height };
  };

  return (
    <div ref={scheduleRef} className="h-full overflow-y-auto border border-t-0 rounded-b-lg">
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-8'} gap-0`}>
        {/* Time column */}
        <div className="border-r">
          {renderHours.map((hour) => {
            const isWorking = hour >= workingHours.start && hour < workingHours.end;
            return (
              <div
                key={hour}
                ref={hour === scrollTargetHour ? firstHourRef : undefined}
                className={`h-12 p-2 border-b text-xs text-center ${
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
            const intersectsDay = aEnd > dayStart && aStart < dayEnd;
            if (!intersectsDay) return false;
            if (!showNonWorkingHours) {
              const workStart = dayStart + workingHours.start * 60 * 60 * 1000;
              const workEnd = dayStart + workingHours.end * 60 * 60 * 1000;
              return aEnd > workStart && aStart < workEnd;
            }
            return true;
          });

          return (
            <div key={day.toISOString()} className="relative border-r">
              {/* Background clickable slots with pointer handlers */}
              <div
                className="relative"
                onPointerDown={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  const offsetIndex = Math.max(0, Math.min(totalRenderedSlots - 1, Math.floor(offsetY / SLOT_HEIGHT_PX)));
                  const index = offsetIndex + renderStartSlot;
                  setDrag({ dayISO: day.toISOString(), startIndex: index, endIndex: index, startTime: Date.now() });
                  (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!drag || drag.dayISO !== day.toISOString()) return;
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  const offsetIndex = Math.max(0, Math.min(totalRenderedSlots - 1, Math.floor(offsetY / SLOT_HEIGHT_PX)));
                  const index = offsetIndex + renderStartSlot;
                  setDrag({ ...drag, endIndex: index });
                }}
                onPointerUp={() => {
                  if (!drag || drag.dayISO !== day.toISOString()) return;
                  const duration = Date.now() - drag.startTime;
                  const start = Math.min(drag.startIndex, drag.endIndex);
                  const endExclusive = Math.max(drag.startIndex, drag.endIndex) + 1;
                  const startHour = Math.floor(start / SLOTS_PER_HOUR);
                  const startMinute = (start % SLOTS_PER_HOUR) * 15;
                  const endIndex = Math.min(endExclusive, renderEndSlot);
                  let endHour = Math.floor(endIndex / SLOTS_PER_HOUR);
                  let endMinute = (endIndex % SLOTS_PER_HOUR) * 15;
                  if (endHour === 24) { endHour = 23; endMinute = 45; }

                  if (endExclusive - start <= 1) {
                    if (duration < HOLD_DELAY_MS) {
                      onTimeSlotClick(day, Math.floor(start / SLOTS_PER_HOUR));
                    } else {
                      onTimeSlotClick(day, start / SLOTS_PER_HOUR);
                    }
                  } else {
                    onTimeRangeSelect?.(day, startHour, startMinute, endHour, endMinute);
                  }
                  setDrag(null);
                }}
                onPointerCancel={() => setDrag(null)}
              >
                {renderHours.map((hour) => {
                  const isWorking = hour >= workingHours.start && hour < workingHours.end;
                  const cellClass = weekend || !isWorking ? 'bg-muted/10 hover:bg-muted/20 opacity-60' : 'hover:bg-muted/30';
                  return (
                    <div
                      key={hour}
                      className={`relative h-12 border-b p-1 cursor-pointer transition-colors ${cellClass}`}
                    />
                  );
                })}

                {/* Drag selection overlay (below appointments) */}
                {drag && drag.dayISO === day.toISOString() && (
                  <div className="pointer-events-none absolute inset-0">
                    {(() => {
                      const start = Math.min(drag.startIndex, drag.endIndex);
                      const endExclusive = Math.max(drag.startIndex, drag.endIndex) + 1;
                      const top = (start - renderStartSlot) * SLOT_HEIGHT_PX;
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
                      className={`pointer-events-auto absolute left-1 right-1 rounded-md border shadow-sm ${getLocationColor(appointment.location_id)}`}
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
