import { describe, expect, it } from 'vitest';
import { describeDays } from '../lib/habitText';

describe('describeDays', () => {
  it('says every day for an empty or full week', () => {
    expect(describeDays({ days: [] })).toBe('כל יום');
    expect(describeDays({ days: [0, 1, 2, 3, 4, 5, 6] })).toBe('כל יום');
  });
  it('lists chosen weekdays in order', () => {
    expect(describeDays({ days: [4, 0, 2] })).toBe('א׳ ג׳ ה׳');
  });
});
