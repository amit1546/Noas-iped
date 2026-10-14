import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { he } from 'date-fns/locale';
import type { ISODate } from '../db/schema';

export const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd');
export const todayISO = (): ISODate => toISO(new Date());
export const fromISO = (s: ISODate): Date => parseISO(s);
export const shiftISO = (s: ISODate, days: number): ISODate => toISO(addDays(fromISO(s), days));

export const formatLong = (s: ISODate) => format(fromISO(s), 'EEEE, d בMMMM', { locale: he });
export const formatShort = (s: ISODate) => format(fromISO(s), 'd/M');
export const weekdayShort = (s: ISODate) => format(fromISO(s), 'EEEEEE', { locale: he });

export function hebrewDate(s: ISODate): string {
  try {
    return new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long' }).format(fromISO(s));
  } catch {
    return '';
  }
}

/** Week starts on Sunday (Israeli week). */
export const weekStartISO = (s: ISODate): ISODate => toISO(startOfWeek(fromISO(s), { weekStartsOn: 0 }));

export function rangeISO(from: ISODate, count: number): ISODate[] {
  return Array.from({ length: count }, (_, i) => shiftISO(from, i));
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}
