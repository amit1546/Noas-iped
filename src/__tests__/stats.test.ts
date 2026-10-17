import { describe, expect, it } from 'vitest';
import { calorieStatus, sumMeals, weeklyWeightChange } from '../lib/stats';

describe('stats', () => {
  it('sums meals', () => {
    expect(sumMeals([{ calories: 400, protein: 30 }, { calories: 250, protein: 0 }])).toEqual({ calories: 650, protein: 30 });
  });

  it('counts meals with no calories or protein as zero', () => {
    expect(sumMeals([{ calories: 0, protein: 0 }, { calories: 300, protein: 20 }])).toEqual({ calories: 300, protein: 20 });
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
    expect(calorieStatus(1999, 2000)).toBe('near');
    expect(calorieStatus(2000, 2000)).toBe('reached');
    expect(calorieStatus(2100, 2000)).toBe('reached');
  });

  it('compares the average weight of this week with the week before', () => {
    const w = [
      { date: '2026-10-01', kg: 70 },
      { date: '2026-10-05', kg: 71 },
      { date: '2026-10-09', kg: 72 },
      { date: '2026-10-12', kg: 72.4 },
    ];
    expect(weeklyWeightChange(w, '2026-10-14')).toEqual({ current: 72.2, diff: 1.7 });
    expect(weeklyWeightChange([{ date: '2026-10-14', kg: 70 }], '2026-10-14')).toBeNull();
  });
});
