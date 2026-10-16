import { describe, expect, it } from 'vitest';
import { eventsICS, type CalEvent } from '../lib/calendarExport';

const NOW = new Date(2026, 9, 16, 12, 0, 0);
const ev = (over: Partial<CalEvent> = {}): CalEvent => ({
  uid: 'task-1',
  kind: 'task',
  title: 'לשלם חשבון',
  date: '2026-10-17',
  time: '09:30',
  ...over,
});
const count = (s: string, needle: string) => s.split(needle).length - 1;

describe('calendar export', () => {
  it('makes one event per item, each with an alert', () => {
    const ics = eventsICS([ev(), ev({ uid: 'workout-2', kind: 'workout', title: 'ריצה', time: '18:00' })], 0, NOW);
    expect(count(ics, 'BEGIN:VEVENT')).toBe(2);
    expect(count(ics, 'END:VEVENT')).toBe(2);
    expect(count(ics, 'BEGIN:VALARM')).toBe(2);
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
  });

  it('writes local start and end times', () => {
    const ics = eventsICS([ev({ kind: 'workout', time: '18:00' })], 0, NOW);
    expect(ics).toContain('DTSTART:20261017T180000');
    expect(ics).toContain('DTEND:20261017T190000'); // a workout lasts an hour
  });

  it('handles an event that runs past midnight', () => {
    expect(eventsICS([ev({ kind: 'workout', time: '23:30' })], 0, NOW)).toContain('DTEND:20261018T003000');
  });

  it('sets the alert lead time', () => {
    expect(eventsICS([ev()], 0, NOW)).toContain('TRIGGER:-PT0M');
    expect(eventsICS([ev()], 10, NOW)).toContain('TRIGGER:-PT10M');
    expect(eventsICS([ev()], 30, NOW)).toContain('TRIGGER:-PT30M');
  });

  it('puts an emoji for the kind in the title and escapes special characters', () => {
    const ics = eventsICS([ev({ title: 'חלב, ביצים; לחם' })], 0, NOW);
    expect(ics).toContain('SUMMARY:✅ חלב\\, ביצים\; לחם');
  });

  it('keeps ids stable so sending again updates instead of duplicating', () => {
    const a = eventsICS([ev()], 0, NOW);
    const b = eventsICS([ev()], 0, new Date(2026, 9, 16, 12, 5, 0));
    expect(a).toContain('UID:task-1@noas-journal');
    expect(b).toContain('UID:task-1@noas-journal');
    expect(a).not.toBe(b); // but the version number moves forward
  });

  it('repeats weekly on chosen weekdays, or daily', () => {
    expect(eventsICS([ev({ kind: 'habit', repeat: [4, 0, 2] })], 0, NOW)).toContain('RRULE:FREQ=WEEKLY;BYDAY=SU,TU,TH');
    expect(eventsICS([ev({ kind: 'habit', repeat: 'daily' })], 0, NOW)).toContain('RRULE:FREQ=DAILY');
    expect(eventsICS([ev()], 0, NOW)).not.toContain('RRULE');
  });
});

import { candidateEvents } from '../lib/calendarExport';
import type { Habit, Meal, Reminder, Task, Workout } from '../db/schema';

describe('what gets offered to the calendar', () => {
  const days = ['2026-10-18', '2026-10-19', '2026-10-20']; // Sun, Mon, Tue
  const task = (o: Partial<Task>): Task => ({ id: 1, title: 'משימה', date: '2026-10-18', done: false, priority: 'medium', ...o });
  const base = { days, tasks: [], workouts: [], meals: [], reminders: [], habits: [], recurHabits: false };

  it('only offers items that have a time and still matter', () => {
    const events = candidateEvents({
      ...base,
      tasks: [task({ id: 1, time: '09:00' }), task({ id: 2 }), task({ id: 3, time: '10:00', done: true }), task({ id: 4, time: '11:00', date: '2026-11-01' })],
      workouts: [
        { id: 1, date: '2026-10-18', type: 'other', title: 'ריצה', durationMin: 0, exercises: [], time: '07:00', done: false },
        { id: 2, date: '2026-10-18', type: 'other', title: 'בוצע', durationMin: 0, exercises: [], time: '08:00', done: true },
      ] as Workout[],
      meals: [
        { id: 1, date: '2026-10-18', mealType: 'lunch', name: 'פסטה', calories: 0, protein: 0, planned: true, time: '13:00' },
        { id: 2, date: '2026-10-18', mealType: 'lunch', name: 'נאכל', calories: 0, protein: 0, time: '14:00' },
      ] as Meal[],
      reminders: [{ id: 1, date: '2026-10-19', text: 'להתקשר', time: '16:00' }, { id: 2, date: '2026-10-19', text: 'בלי שעה' }] as Reminder[],
    });
    expect(events.map((e) => e.uid)).toEqual(['workout-1', 'task-1', 'meal-1', 'reminder-1']); // sorted by day then time
  });

  const habit: Habit = { id: 7, name: 'ריצת בוקר', emoji: '🏃', color: '#000', days: [0, 2], archived: false, createdAt: '2026-01-01', time: '06:30' };

  it('offers a habit on each day it is due', () => {
    const events = candidateEvents({ ...base, habits: [habit] });
    expect(events.map((e) => e.date)).toEqual(['2026-10-18', '2026-10-20']); // Sunday and Tuesday only
  });

  it('can turn a habit into one repeating event', () => {
    const events = candidateEvents({ ...base, habits: [habit], recurHabits: true });
    expect(events).toHaveLength(1);
    expect(events[0].repeat).toEqual([0, 2]);
    expect(events[0].date).toBe('2026-10-18');
  });

  it('skips habits without a time or that did not exist yet', () => {
    expect(candidateEvents({ ...base, habits: [{ ...habit, time: undefined }] })).toHaveLength(0);
    expect(candidateEvents({ ...base, habits: [{ ...habit, createdAt: '2026-12-01' }] })).toHaveLength(0);
  });
});
