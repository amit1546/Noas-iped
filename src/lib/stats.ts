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

export type CalorieStatus = 'under' | 'near' | 'over';

/** near = within the last 10% before the goal; over = above the goal. */
export function calorieStatus(eaten: number, goal: number): CalorieStatus {
  if (goal <= 0) return 'under';
  if (eaten > goal) return 'over';
  if (eaten >= goal * 0.9) return 'near';
  return 'under';
}

export function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
