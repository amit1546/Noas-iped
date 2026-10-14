import { describe, expect, it } from 'vitest';
import { bestStreak, currentStreak, isScheduled } from '../lib/streaks';

const daily = { days: [], createdAt: '2026-01-01' };

describe('currentStreak', () => {
  it('counts consecutive days ending today', () => {
    const done = new Set(['2026-03-08', '2026-03-09', '2026-03-10']);
    expect(currentStreak(daily, done, '2026-03-10')).toBe(3);
  });

  it('does not break when today is not done yet', () => {
    const done = new Set(['2026-03-08', '2026-03-09']);
    expect(currentStreak(daily, done, '2026-03-10')).toBe(2);
  });

  it('breaks on a missed day', () => {
    const done = new Set(['2026-03-07', '2026-03-09', '2026-03-10']);
    expect(currentStreak(daily, done, '2026-03-10')).toBe(2);
  });

  it('skips unscheduled days', () => {
    // 2026-03-08 is a Sunday (0), 2026-03-10 is Tuesday (2)
    const sunTue = { days: [0, 2] as (0 | 2)[], createdAt: '2026-01-01' };
    const done = new Set(['2026-03-03', '2026-03-08', '2026-03-10']);
    expect(currentStreak(sunTue, done, '2026-03-10')).toBe(3);
  });

  it('is zero with no history', () => {
    expect(currentStreak(daily, new Set(), '2026-03-10')).toBe(0);
  });
});

describe('bestStreak', () => {
  it('finds the longest run', () => {
    const done = new Set(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-05', '2026-03-06']);
    expect(bestStreak(daily, done)).toBe(3);
  });
});

describe('isScheduled', () => {
  it('treats empty days as every day', () => {
    expect(isScheduled({ days: [] }, '2026-03-10')).toBe(true);
  });
  it('respects specific weekdays', () => {
    expect(isScheduled({ days: [0] }, '2026-03-08')).toBe(true);
    expect(isScheduled({ days: [0] }, '2026-03-09')).toBe(false);
  });
});
