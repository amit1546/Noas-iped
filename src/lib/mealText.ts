import type { MealType } from '../db/schema';

/** The ingredients of a meal: one per line, blank lines dropped. */
export function ingredientLines(details?: string): string[] {
  return (details ?? '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-•*·]+/, '').trim())
    .filter(Boolean);
}

/** Which meal a time of day belongs to (now, if no time is given). */
export function mealTypeForTime(time?: string): MealType {
  const h = time ? Number(time.slice(0, 2)) : new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

/** "350 קל׳ · 30 גר׳" — leaves out whatever wasn't entered; empty string if neither was. */
export function nutritionText(m: { calories: number; protein: number }, withProteinLabel = false): string {
  const parts: string[] = [];
  if (m.calories > 0) parts.push(`${m.calories} קל׳`);
  if (m.protein > 0) parts.push(withProteinLabel ? `${m.protein} גר׳ חלבון` : `${m.protein} גר׳`);
  return parts.join(' · ');
}
