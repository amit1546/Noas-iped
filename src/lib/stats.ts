import type { Meal } from '../db/schema';

export interface DayTotals {
  calories: number;
  protein: number;
}

/** Totals of what was actually eaten (planned meals are skipped). */
export function sumMeals(meals: Pick<Meal, 'calories' | 'protein' | 'planned'>[]): DayTotals {
  return meals.filter((m) => !m.planned).reduce(
    (acc, m) => ({ calories: acc.calories + (m.calories || 0), protein: acc.protein + (m.protein || 0) }),
    { calories: 0, protein: 0 },
  );
}

export type CalorieStatus = 'under' | 'near' | 'reached';

/** near = within the last 10% before the goal; reached = at or above the goal (the aim is to gain weight, so that's the good side). */
export function calorieStatus(eaten: number, goal: number): CalorieStatus {
  if (goal <= 0) return 'under';
  if (eaten >= goal) return 'reached';
  if (eaten >= goal * 0.9) return 'near';
  return 'under';
}

export function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Average weight of the last 7 days against the 7 days before; null until there is something to compare. */
export function weeklyWeightChange(weights: { date: string; kg: number }[], today: string): { current: number; diff: number } | null {
  const day = (iso: string) => Math.round((Date.parse(today) - Date.parse(iso)) / 86400000);
  const avg = (from: number, to: number) => {
    const xs = weights.filter((w) => day(w.date) >= from && day(w.date) <= to).map((w) => w.kg);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const current = avg(0, 6);
  const previous = avg(7, 13);
  if (current == null || previous == null) return null;
  return { current: Math.round(current * 10) / 10, diff: Math.round((current - previous) * 10) / 10 };
}
