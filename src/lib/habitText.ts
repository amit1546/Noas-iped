import type { Habit } from '../db/schema';

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

/** "כל יום" or the chosen weekdays, e.g. "א׳ ג׳ ה׳". */
export function describeDays(h: Pick<Habit, 'days'>): string {
  if (!h.days.length || h.days.length === 7) return 'כל יום';
  return [...h.days].sort().map((d) => DAY_NAMES[d]).join(' ');
}
