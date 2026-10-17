import { describe, expect, it } from 'vitest';
import { amountText, defaultAmount, scaleNutrition } from '../lib/amount';

describe('amounts', () => {
  it('scales per-100 values by grams', () => {
    expect(scaleNutrition({ calories: 100, protein: 4 }, 'per100', 300)).toEqual({ calories: 300, protein: 12 });
    expect(scaleNutrition({ calories: 131, protein: 5 }, 'per100', 250)).toEqual({ calories: 328, protein: 13 });
  });
  it('scales per-serving values by number of servings', () => {
    expect(scaleNutrition({ calories: 200, protein: 10 }, 'serving', 1.5)).toEqual({ calories: 300, protein: 15 });
  });
  it('starts from 100 or 1', () => {
    expect(defaultAmount('per100')).toBe(100);
    expect(defaultAmount('serving')).toBe(1);
  });
  it('words the amount; nothing for old meals', () => {
    expect(amountText({ unit: 'per100', amount: 300, mealType: 'lunch' })).toBe('300 גר׳');
    expect(amountText({ unit: 'per100', amount: 250, mealType: 'drink' })).toBe('250 מ״ל');
    expect(amountText({ unit: 'serving', amount: 2, mealType: 'lunch' })).toBe('2 מנות');
    expect(amountText({ mealType: 'lunch' })).toBe('');
  });
});
