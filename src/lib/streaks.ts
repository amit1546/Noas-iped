import type { Habit, ISODate } from '../db/schema';
import { fromISO, shiftISO } from './dates';

export function isScheduled(habit: Pick<Habit, 'days'>, date: ISODate): boolean {
  if (!habit.days.length) return true;
  return habit.days.includes(fromISO(date).getDay() as Habit['days'][number]);
}

/**
 * Current streak: consecutive scheduled days ending today (or yesterday, if today
 * isn't done yet) that were completed. Unscheduled days don't break the streak.
 */
export function currentStreak(
  habit: Pick<Habit, 'days' | 'createdAt'>,
  doneDates: Set<ISODate>,
  today: ISODate,
): number {
  let streak = 0;
  let d = today;
  // Today not done yet doesn't break the streak.
  if (isScheduled(habit, d) && !doneDates.has(d)) d = shiftISO(d, -1);
  for (let i = 0; i < 3660; i++) {
    if (d < habit.createdAt && !doneDates.has(d)) break;
    if (isScheduled(habit, d)) {
      if (doneDates.has(d)) streak++;
      else break;
    }
    d = shiftISO(d, -1);
  }
  return streak;
}

export function bestStreak(habit: Pick<Habit, 'days'>, doneDates: Set<ISODate>): number {
  if (!doneDates.size) return 0;
  const sorted = [...doneDates].sort();
  let best = 0;
  let run = 0;
  let d = sorted[0];
  const last = sorted[sorted.length - 1];
  while (d <= last) {
    if (isScheduled(habit, d)) {
      if (doneDates.has(d)) {
        run++;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    d = shiftISO(d, 1);
  }
  return best;
}
