import { describe, it, expect } from 'vitest';
import { composeEffectiveAvailability, CalendarException, WorkingHours } from './calendarExceptions';

describe('composeEffectiveAvailability', () => {
  const base: WorkingHours = { start: 8, end: 17 };

  it('returns null when blackout applies', () => {
    const exceptions: CalendarException[] = [
      {
        id: '1',
        type: 'BLACKOUT',
        dateStart: '2024-08-10T00:00:00.000Z',
        dateEnd: '2024-08-11T00:00:00.000Z',
        reason: 'Holiday',
        locationId: null,
        recurrence: null,
        createdAt: '2024-07-01T00:00:00.000Z',
      },
    ];
    const result = composeEffectiveAvailability(new Date('2024-08-10T12:00:00.000Z'), base, exceptions);
    expect(result).toBeNull();
  });

  it('expands hours for extra opening on closed day', () => {
    const baseClosed: WorkingHours = { start: 0, end: 0 };
    const exceptions: CalendarException[] = [
      {
        id: '2',
        type: 'EXTRA_OPEN',
        dateStart: '2024-08-10T09:00:00.000Z',
        dateEnd: '2024-08-10T12:00:00.000Z',
        locationId: null,
        recurrence: null,
        createdAt: '2024-07-01T00:00:00.000Z',
      },
    ];
    const result = composeEffectiveAvailability(new Date('2024-08-10T00:00:00.000Z'), baseClosed, exceptions);
    expect(result).toEqual({ start: 9, end: 12 });
  });

  it('adjusts working hours for day adjustment', () => {
    const exceptions: CalendarException[] = [
      {
        id: '3',
        type: 'DAY_ADJUST',
        dateStart: '2024-08-12T10:00:00.000Z',
        dateEnd: '2024-08-12T16:00:00.000Z',
        locationId: null,
        recurrence: null,
        createdAt: '2024-07-01T00:00:00.000Z',
      },
    ];
    const result = composeEffectiveAvailability(new Date('2024-08-12T00:00:00.000Z'), base, exceptions);
    expect(result).toEqual({ start: 10, end: 16 });
  });
});

