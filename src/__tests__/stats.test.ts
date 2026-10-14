import { describe, expect, it } from 'vitest';
import { calorieStatus, sumMeals } from '../lib/stats';

describe('stats', () => {
  it('sums meals', () => {
    expect(sumMeals([{ calories: 400, protein: 30 }, { calories: 250, protein: 0 }])).toEqual({ calories: 650, protein: 30 });
  });

  it('ignores planned meals', () => {
    expect(sumMeals([{ calories: 400, protein: 30 }, { calories: 900, protein: 40, planned: true }])).toEqual({
      calories: 400,
      protein: 30,
    });
  });

  it('classifies calorie status against the goal', () => {
    expect(calorieStatus(1000, 2000)).toBe('under');
    expect(calorieStatus(1850, 2000)).toBe('near');
    expect(calorieStatus(2000, 2000)).toBe('near');
    expect(calorieStatus(2100, 2000)).toBe('over');
  });

});
