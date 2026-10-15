import { describe, expect, it } from 'vitest';
import { fixedMealTypes } from '../db/schema';
import { nutritionText } from '../lib/mealText';

describe('fixed meal types', () => {
  it('falls back to the single type for meals saved before multi-type support', () => {
    expect(fixedMealTypes({ mealType: 'lunch' })).toEqual(['lunch']);
  });

  it('returns every chosen type in day order', () => {
    expect(fixedMealTypes({ mealType: 'dinner', mealTypes: ['dinner', 'lunch'] })).toEqual(['lunch', 'dinner']);
  });

  it('ignores an empty list', () => {
    expect(fixedMealTypes({ mealType: 'snack', mealTypes: [] })).toEqual(['snack']);
  });
});

describe('nutrition text', () => {
  it('leaves out calories and protein that were not entered', () => {
    expect(nutritionText({ calories: 0, protein: 0 })).toBe('');
    expect(nutritionText({ calories: 350, protein: 0 })).toBe('350 קל׳');
    expect(nutritionText({ calories: 0, protein: 20 })).toBe('20 גר׳');
    expect(nutritionText({ calories: 350, protein: 20 }, true)).toBe('350 קל׳ · 20 גר׳ חלבון');
  });
});
