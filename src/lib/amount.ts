import type { MealUnit } from '../db/schema';

export const unitOf = (m: { unit?: MealUnit }): MealUnit => m.unit ?? 'serving';

/** What to start from: 100 g for per-100 meals, one serving otherwise. */
export const defaultAmount = (unit: MealUnit) => (unit === 'per100' ? 100 : 1);

/** The word after the number: grams (ml for drinks) or servings. */
export const amountSuffix = (unit: MealUnit, drink = false) => (unit === 'per100' ? (drink ? 'מ״ל' : 'גר׳') : 'מנות');

/** Calories and protein for an amount, given the values per unit. */
export function scaleNutrition(per: { calories: number; protein: number }, unit: MealUnit, amount: number) {
  const factor = unit === 'per100' ? amount / 100 : amount;
  return { calories: Math.round(per.calories * factor), protein: Math.round(per.protein * factor) };
}

/** "300 גר׳" — empty for meals saved before amounts existed. */
export function amountText(m: { unit?: MealUnit; amount?: number; mealType: string }): string {
  if (!m.unit || !m.amount) return '';
  return `${m.amount.toLocaleString('he-IL')} ${amountSuffix(m.unit, m.mealType === 'drink')}`;
}
