import { describe, expect, it } from 'vitest';
import { fixedMealTypes, type FixedMeal } from '../db/schema';
import { duplicateGroups, mergeGroup } from '../lib/fixedMeals';
import { ingredientLines, mealTypeForTime, nutritionText } from '../lib/mealText';

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


const meal = (over: Partial<FixedMeal>): FixedMeal => ({
  id: 1,
  name: 'פסטה',
  mealType: 'lunch',
  calories: 0,
  protein: 0,
  active: true,
  order: 1,
  ...over,
});

describe('duplicate fixed meals', () => {
  it('finds meals saved twice under the same name', () => {
    const groups = duplicateGroups([meal({ id: 1 }), meal({ id: 2, mealType: 'dinner', order: 2 }), meal({ id: 3, name: 'סלט' })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((m) => m.id)).toEqual([1, 2]);
  });

  it('ignores differences in spacing and letter case', () => {
    expect(duplicateGroups([meal({ id: 1, name: 'Pasta ' }), meal({ id: 2, name: ' pasta' })])).toHaveLength(1);
  });

  it('merges into one meal that fits both times and keeps what was entered', () => {
    const merged = mergeGroup([
      meal({ id: 5, mealType: 'dinner', order: 3, calories: 0 }),
      meal({ id: 4, mealType: 'lunch', order: 2, calories: 600, protein: 25 }),
    ]);
    expect(merged.id).toBe(4); // the earlier one is kept
    expect(merged.mealTypes).toEqual(['lunch', 'dinner']);
    expect(merged.calories).toBe(600);
    expect(merged.protein).toBe(25);
  });
});

describe('meal details', () => {
  it('splits ingredients one per line and drops blanks and bullets', () => {
    expect(ingredientLines('חלב\n\n- בננה\n• חלבון\r\n  שיבולת שועל  ')).toEqual(['חלב', 'בננה', 'חלבון', 'שיבולת שועל']);
    expect(ingredientLines(undefined)).toEqual([]);
    expect(ingredientLines('  \n ')).toEqual([]);
  });

  it('keeps the first ingredients list when merging duplicates', () => {
    const merged = mergeGroup([
      meal({ id: 1, order: 1, details: '' }),
      meal({ id: 2, order: 2, mealType: 'dinner', details: 'פסטה\nרוטב' }),
    ]);
    expect(merged.details).toBe('פסטה\nרוטב');
  });

  it('maps a time of day to a meal', () => {
    expect(mealTypeForTime('07:30')).toBe('breakfast');
    expect(mealTypeForTime('13:00')).toBe('lunch');
    expect(mealTypeForTime('19:45')).toBe('dinner');
    expect(mealTypeForTime('22:10')).toBe('snack');
  });
});
