import { isWorkoutDone, type Habit, type ISODate, type Meal, type Reminder, type Task, type Weekday, type Workout } from '../db/schema';
import { isScheduled } from './streaks';

export type EventKind = 'task' | 'habit' | 'workout' | 'meal' | 'reminder';

export interface CalEvent {
  /** Stable per item, so sending the same thing again updates the calendar entry instead of doubling it */
  uid: string;
  kind: EventKind;
  title: string;
  date: ISODate;
  /** HH:mm */
  time: string;
  /** Repeat weekly on these weekdays, or every day */
  repeat?: Weekday[] | 'daily';
}

export const KIND_EMOJI: Record<EventKind, string> = {
  task: '✅',
  habit: '🔁',
  workout: '💪',
  meal: '🍽️',
  reminder: '🔔',
};

/** How long the calendar entry lasts. */
const DURATION_MIN: Record<EventKind, number> = { task: 30, habit: 15, workout: 60, meal: 30, reminder: 15 };

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const escape = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/**
 * One .ics file with an event (and an alert) for each item. Opening it adds them to the
 * phone's calendar, and from there to a paired Apple Watch. `leadMin` = how many minutes
 * before the event the alert goes off (0 = at the time).
 */
export function eventsICS(events: CalEvent[], leadMin: number, now = new Date()): string {
  const [stampUtc] = [now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')];
  // A rising number tells the calendar this is a newer version of an event it may already have.
  const sequence = Math.floor(now.getTime() / 60000);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//noas-journal//HE', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    const [y, mo, d] = e.date.split('-').map(Number);
    const [h, mi] = e.time.split(':').map(Number);
    const start = new Date(y, mo - 1, d, h, mi, 0);
    const end = new Date(start.getTime() + DURATION_MIN[e.kind] * 60000);
    const title = `${KIND_EMOJI[e.kind]} ${escape(e.title)}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@noas-journal`,
      `DTSTAMP:${stampUtc}`,
      `SEQUENCE:${sequence}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
    );
    if (e.repeat === 'daily') lines.push('RRULE:FREQ=DAILY');
    else if (e.repeat?.length) lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${[...e.repeat].sort().map((x) => DAY_CODES[x]).join(',')}`);
    lines.push(
      `SUMMARY:${title}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${title}`,
      `TRIGGER:-PT${Math.max(0, Math.round(leadMin))}M`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Everything on the given days that has a time and still matters: open tasks, workouts not done yet,
 * meals still planned, reminders, and the habits due those days. With `recurHabits`, a habit
 * becomes a single repeating event instead of one event per day.
 */
export function candidateEvents(input: {
  days: ISODate[];
  tasks: Task[];
  workouts: Workout[];
  meals: Meal[];
  reminders: Reminder[];
  habits: Habit[];
  recurHabits: boolean;
}): CalEvent[] {
  const { days, recurHabits } = input;
  const inRange = (d: ISODate) => days.includes(d);
  const out: CalEvent[] = [];
  for (const t of input.tasks) if (t.time && !t.done && inRange(t.date)) out.push({ uid: `task-${t.id}`, kind: 'task', title: t.title, date: t.date, time: t.time });
  for (const w of input.workouts)
    if (w.time && !isWorkoutDone(w) && inRange(w.date)) out.push({ uid: `workout-${w.id}`, kind: 'workout', title: w.title || 'אימון', date: w.date, time: w.time });
  for (const m of input.meals) if (m.time && m.planned && inRange(m.date)) out.push({ uid: `meal-${m.id}`, kind: 'meal', title: m.name, date: m.date, time: m.time });
  for (const r of input.reminders) if (r.time && inRange(r.date)) out.push({ uid: `reminder-${r.id}`, kind: 'reminder', title: r.text, date: r.date, time: r.time });
  for (const h of input.habits) {
    if (!h.time) continue;
    const due = days.filter((d) => isScheduled(h, d) && h.createdAt <= d);
    if (!due.length) continue;
    const title = `${h.emoji} ${h.name}`;
    if (recurHabits) {
      const everyDay = !h.days.length || h.days.length === 7;
      out.push({ uid: `habit-${h.id}`, kind: 'habit', title, date: due[0], time: h.time, repeat: everyDay ? 'daily' : h.days });
    } else {
      for (const d of due) out.push({ uid: `habit-${h.id}-${d}`, kind: 'habit', title, date: d, time: h.time });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}
