export type ExceptionType = 'BLACKOUT' | 'EXTRA_OPEN' | 'DAY_ADJUST';

export interface CalendarException {
  id: string;
  type: ExceptionType;
  dateStart: string;
  dateEnd: string;
  reason?: string;
  locationId?: string | null;
  recurrence?: string | null;
  createdAt: string;
  createdBy?: string;
}

const STORAGE_KEY = 'sorriso.exceptions.v1';

function readLocal(): CalendarException[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CalendarException[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: CalendarException[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function listExceptions(): Promise<CalendarException[]> {
  try {
    const res = await fetch('/api/exceptions');
    if (!res.ok) throw new Error('API error');
    return (await res.json()) as CalendarException[];
  } catch {
    return readLocal();
  }
}

export async function addException(exc: CalendarException): Promise<CalendarException> {
  try {
    const res = await fetch('/api/exceptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exc),
    });
    if (!res.ok) throw new Error('API error');
    return (await res.json()) as CalendarException;
  } catch {
    const list = readLocal();
    list.push(exc);
    writeLocal(list);
    return exc;
  }
}

export async function updateException(exc: CalendarException): Promise<CalendarException> {
  try {
    const res = await fetch(`/api/exceptions/${exc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exc),
    });
    if (!res.ok) throw new Error('API error');
    return (await res.json()) as CalendarException;
  } catch {
    const list = readLocal();
    const idx = list.findIndex((e) => e.id === exc.id);
    if (idx !== -1) {
      list[idx] = exc;
      writeLocal(list);
    }
    return exc;
  }
}

export async function removeException(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/exceptions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('API error');
  } catch {
    const list = readLocal().filter((e) => e.id !== id);
    writeLocal(list);
  }
}

export interface WorkingHours {
  start: number;
  end: number;
}

function toHour(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}

export function composeEffectiveAvailability(
  date: Date,
  base: WorkingHours,
  exceptions: CalendarException[],
): WorkingHours | null {
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const applicable = exceptions.filter((ex) => {
    const exStart = new Date(ex.dateStart);
    const exEnd = new Date(ex.dateEnd);
    return exEnd > dayStart && exStart < dayEnd;
  });

  if (applicable.some((ex) => ex.type === 'BLACKOUT')) {
    return null;
  }

  let result: WorkingHours = { ...base };

  for (const ex of applicable) {
    if (ex.type === 'DAY_ADJUST') {
      result = { start: toHour(ex.dateStart), end: toHour(ex.dateEnd) };
    } else if (ex.type === 'EXTRA_OPEN') {
      const startHour = toHour(ex.dateStart);
      const endHour = toHour(ex.dateEnd);
      if (result.start >= result.end) {
        result = { start: startHour, end: endHour };
      } else {
        result = { start: Math.min(result.start, startHour), end: Math.max(result.end, endHour) };
      }
    }
  }

  return result;
}

