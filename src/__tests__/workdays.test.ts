import { describe, expect, it } from 'vitest';
import { isWeeklyWorkDay, isWorkDay } from '../lib/workdays';

// 2026-03-08 is a Sunday, 2026-03-13 a Friday, 2026-03-14 a Saturday
const settings = { workDays: [0, 1, 2, 3, 4] as (0 | 1 | 2 | 3 | 4)[] };

describe('work days', () => {
  it('follows the weekly pattern', () => {
    expect(isWorkDay('2026-03-08', settings)).toBe(true);
    expect(isWorkDay('2026-03-13', settings)).toBe(false);
    expect(isWorkDay('2026-03-14', settings)).toBe(false);
  });

  it('lets a single date override the pattern both ways', () => {
    const s = { ...settings, workOverrides: { '2026-03-08': false, '2026-03-13': true } };
    expect(isWorkDay('2026-03-08', s)).toBe(false);
    expect(isWorkDay('2026-03-13', s)).toBe(true);
    expect(isWeeklyWorkDay('2026-03-08', s)).toBe(true);
  });

  it('treats no selected weekdays as no work days', () => {
    expect(isWorkDay('2026-03-08', { workDays: [] })).toBe(false);
  });
});
