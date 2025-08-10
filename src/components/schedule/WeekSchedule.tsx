import { useMemo, RefObject, useState, useRef } from 'react';
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

type LayoutInfo = { column: number; totalColumns: number };

function computeLayout(appointments: Appointment[]): Record<string, LayoutInfo> {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const groups: Appointment[][] = [];
  let currentGroup: Appointment[] = [];
  let currentEnd = 0;

  sorted.forEach((appt) => {
    const start = new Date(appt.start_time).getTime();
    const end = new Date(appt.end_time).getTime();
    if (currentGroup.length === 0 || start < currentEnd) {
      currentGroup.push(appt);
      currentEnd = Math.max(currentEnd, end);
    } else {
      groups.push(currentGroup);
      currentGroup = [appt];
      currentEnd = end;
    }
  });
  if (currentGroup.length) groups.push(currentGroup);

  const layout: Record<string, LayoutInfo> = {};

  groups.forEach((group) => {
    const columns: Appointment[][] = [];
    group.forEach((appt) => {
      const start = new Date(appt.start_time).getTime();
      let placed = false;
      for (const col of columns) {
        const last = col[col.length - 1];
        const lastEnd = new Date(last.end_time).getTime();
        if (start >= lastEnd) {
          col.push(appt);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([appt]);
      }
    });

    const total = columns.length;
    columns.forEach((col, columnIndex) => {
      col.forEach((appt) => {
        layout[appt.id] = { column: columnIndex, totalColumns: total };
      });
    });
  });

  return layout;
}

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
  const renderStartSlot = showNonWorkingHours ? 0 : Math.floor(workingHours.start * SLOTS_PER_HOUR);
  const renderEndSlot = showNonWorkingHours ? TOTAL_SLOTS : Math.ceil(workingHours.end * SLOTS_PER_HOUR);
  const totalRenderedSlots = renderEndSlot - renderStartSlot;

  const [drag, setDrag] = useState<
    |
      {
        dayISO: string;
        startIndex: number;
        endIndex: number;
        startTime: number;
        mode: 'hour' | 'quarter';
      }
    | null
  >(null);
  const holdTimeoutRef = useRef<number | null>(null);

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
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: `auto repeat(${daysToDisplay.length}, 1fr)` }}
      >
        {/* Time column */}
        <div className="border-r">
          {Array.from({ length: totalRenderedSlots }, (_, i) => {
            const slotIndex = renderStartSlot + i;
            const slotHour = slotIndex / SLOTS_PER_HOUR;
            const isWorking = slotHour >= workingHours.start && slotHour < workingHours.end;
            const isHourBoundary = slotIndex % SLOTS_PER_HOUR === 0;
            const targetSlotIndex = showNonWorkingHours ? Math.floor(scrollTargetHour * SLOTS_PER_HOUR) : Math.floor(workingHours.start * SLOTS_PER_HOUR);
            const attachRef = slotIndex === targetSlotIndex;
            return (
              <div
                key={slotIndex}
                ref={attachRef ? firstHourRef : undefined}
                className={`px-2 py-1 text-[10px] sm:text-xs text-center ${isHourBoundary ? 'border-t' : ''} ${isWorking ? 'bg-muted/50 text-muted-foreground' : 'bg-muted/20 text-muted-foreground/50'}`}
                style={{ height: SLOT_HEIGHT_PX }}
              >
                {isHourBoundary ? formatHour(slotHour) : ''}
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

          const layout = computeLayout(dayAppointments);

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
                  setDrag({
                    dayISO: day.toISOString(),
                    startIndex: index,
                    endIndex: index,
                    startTime: Date.now(),
                    mode: 'hour',
                  });
                  holdTimeoutRef.current = window.setTimeout(() => {
                    setDrag((prev) =>
                      prev && prev.dayISO === day.toISOString() && prev.mode === 'hour'
                        ? { ...prev, mode: 'quarter' }
                        : prev
                    );
                  }, HOLD_DELAY_MS);
                  (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!drag || drag.dayISO !== day.toISOString()) return;
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  const offsetIndex = Math.max(0, Math.min(totalRenderedSlots - 1, Math.floor(offsetY / SLOT_HEIGHT_PX)));
                  const index = offsetIndex + renderStartSlot;
                  if (drag.mode === 'hour') {
                    if (index !== drag.startIndex) {
                      if (holdTimeoutRef.current) {
                        clearTimeout(holdTimeoutRef.current);
                        holdTimeoutRef.current = null;
                      }
                      setDrag({ ...drag, mode: 'quarter', endIndex: index });
                    }
                  } else {
                    setDrag({ ...drag, endIndex: index });
                  }
                }}
                onPointerUp={() => {
                  if (!drag || drag.dayISO !== day.toISOString()) return;
                  if (holdTimeoutRef.current) {
                    clearTimeout(holdTimeoutRef.current);
                    holdTimeoutRef.current = null;
                  }
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
                onPointerCancel={() => {
                  if (holdTimeoutRef.current) {
                    clearTimeout(holdTimeoutRef.current);
                    holdTimeoutRef.current = null;
                  }
                  setDrag(null);
                }}
              >
                {Array.from({ length: totalRenderedSlots }, (_, i) => {
                  const slotIndex = renderStartSlot + i;
                  const slotHour = slotIndex / SLOTS_PER_HOUR;
                  const isWorking = slotHour >= workingHours.start && slotHour < workingHours.end;
                  const cellClass = weekend || !isWorking ? 'bg-muted/10 hover:bg-muted/20 opacity-60' : 'hover:bg-muted/30';
                  const isHourBoundary = slotIndex % SLOTS_PER_HOUR === 0;
                  return (
                    <div
                      key={slotIndex}
                      className={`relative p-1 cursor-pointer transition-colors ${cellClass} ${isHourBoundary ? 'border-t' : ''}`}
                      style={{ height: SLOT_HEIGHT_PX }}
                    />
                  );
                })}

                {/* Drag selection overlay (below appointments) */}
                {drag && drag.dayISO === day.toISOString() && (
                  <div className="pointer-events-none absolute inset-0">
                    {(() => {
                      if (drag.mode === 'hour') {
                        const startHour = Math.floor(drag.startIndex / SLOTS_PER_HOUR);
                        const top = (startHour * SLOTS_PER_HOUR - renderStartSlot) * SLOT_HEIGHT_PX;
                        const height = SLOTS_PER_HOUR * SLOT_HEIGHT_PX;
                        return (
                          <div
                            className="absolute left-1 right-1 rounded-md border border-primary/30 bg-primary/20"
                            style={{ top, height }}
                          />
                        );
                      }
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

                  const info = layout[appointment.id] || { column: 0, totalColumns: 1 };
                  const width = 100 / info.totalColumns;
                  const left = width * info.column;
                  const hasConflict = info.totalColumns > 1;

                  return (
                    <div
                      key={appointment.id}
                      className={`pointer-events-auto absolute rounded-md border shadow-sm ${getLocationColor(appointment.location_id)} ${hasConflict ? 'ring-2 ring-red-500' : ''}`}
                      style={{ top: block.top, height: block.height, left: `${left}%`, width: `${width}%` }}
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
