import type { ISODate, Settings, Weekday } from '../db/schema';
import { fromISO } from './dates';

type WorkSettings = Pick<Settings, 'workDays' | 'workOverrides'>;

/** The weekly pattern alone, ignoring single-day exceptions. */
export const isWeeklyWorkDay = (date: ISODate, s: Pick<Settings, 'workDays'>): boolean =>
  s.workDays.includes(fromISO(date).getDay() as Weekday);

/** A single-day exception wins; otherwise the weekly pattern decides. */
export function isWorkDay(date: ISODate, s: WorkSettings): boolean {
  const override = s.workOverrides?.[date];
  return override ?? isWeeklyWorkDay(date, s);
}
