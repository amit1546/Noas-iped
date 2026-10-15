import { describe, expect, it } from 'vitest';
import { oneOffReminderICS, weeklyReminderICS } from '../lib/reminder';

describe('reminder calendar files', () => {
  it('makes a one-time event with an alert', () => {
    const ics = oneOffReminderICS({ title: 'להתקשר, לרופא', date: '2026-03-12', time: '18:30' });
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('DTSTART:20260312T183000');
    expect(ics).not.toContain('RRULE');
    expect(ics).toContain('להתקשר\\, לרופא'); // commas are escaped
  });

  it('uses 09:00 when there is no time', () => {
    expect(oneOffReminderICS({ title: 'x', date: '2026-03-12' })).toContain('DTSTART:20260312T090000');
  });

  it('weekly weigh-in reminder still repeats', () => {
    const ics = weeklyReminderICS({ title: 'שקילה', weekday: 3, hour: 8, minute: 0, url: 'https://example.com' });
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=WE');
  });
});
