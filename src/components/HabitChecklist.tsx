import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { shiftISO } from '../lib/dates';
import { deleteHabit, toggleHabit, useAllHabitLogs, useHabits } from '../db/queries';
import type { Habit, ISODate, Weekday } from '../db/schema';
import { describeDays } from '../lib/habitText';
import { currentStreak, isScheduled } from '../lib/streaks';
import { useCelebrate } from './Confetti';
import { CheckCircle, IconButton } from './ui';
import { ItemCalendarButton } from './ItemCalendarButton';

/**
 * Every habit with its schedule (days and time) written on it, so you never have to
 * flip through days to find out when one is due. Habits that aren't due on the chosen
 * day are dimmed and can't be checked.
 */
export function HabitChecklist({
  date,
  editing,
  onEdit,
  onAdd,
}: {
  date: ISODate;
  editing: boolean;
  onEdit: (h: Habit) => void;
  /** Opens the habit form (days, time, icon) prefilled with the typed name. */
  onAdd: (name: string) => void;
}) {
  const habits = useHabits();
  const logs = useAllHabitLogs();
  const celebrate = useCelebrate();
  const [name, setName] = useState('');

  const doneByHabit = useMemo(() => {
    const m = new Map<number, Set<ISODate>>();
    for (const l of logs) {
      if (!m.has(l.habitId)) m.set(l.habitId, new Set());
      m.get(l.habitId)!.add(l.date);
    }
    return m;
  }, [logs]);

  const byTime = (a: Habit, b: Habit) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99');
  const dueToday = habits.filter((h) => isScheduled(h, date));
  // Habits due on this day first (by time), then the rest.
  const sorted = [...dueToday].sort(byTime).concat(habits.filter((h) => !isScheduled(h, date)).sort(byTime));

  const onToggle = async (habitId: number) => {
    const nowDone = await toggleHabit(habitId, date);
    if (!nowDone) return;
    const doneCount = dueToday.filter((h) => h.id === habitId || doneByHabit.get(h.id!)?.has(date)).length;
    if (doneCount === dueToday.length) celebrate('כל ההרגלים של היום הושלמו! 🎉');
  };

  const quickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name.trim());
    setName('');
  };

  return (
    <div>
      {habits.length > 0 && !dueToday.length && (
        <p className="pb-3 text-center text-sm text-muted">אין הרגלים שמתוכננים ליום הזה 😌</p>
      )}
      <ul className="mb-3 space-y-2">
        {sorted.map((h) => {
          const dates = doneByHabit.get(h.id!) ?? new Set<ISODate>();
          const due = isScheduled(h, date);
          const done = due && dates.has(date);
          const streak = due ? currentStreak(h, dates, date) : 0;

          // Added to the calendar as a repeating event, starting from the next day it is due.
          const start = [0, 1, 2, 3, 4, 5, 6].map((n) => shiftISO(date, n)).find((d) => isScheduled(h, d)) ?? date;
          const cal = (
            <ItemCalendarButton
              item={{ uid: `habit-${h.id}`, kind: 'habit', title: `${h.emoji} ${h.name}`, date: start, time: h.time, repeat: h.days.length ? h.days : 'daily' }}
            />
          );

          // Same layout in every state: [check] [icon] [name + week strip] [time]
          const body = (
            <>
              <span className="text-2xl">{h.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold leading-tight">{h.name}</span>
                <span className="mt-1.5 flex items-center gap-2">
                  <WeekStrip habit={h} />
                  {streak > 1 && <span className="text-xs text-muted">{streak} ברצף</span>}
                </span>
              </span>
              {h.time && (
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-sm font-bold tabular-nums"
                  style={{ color: h.color, background: `${h.color}1a` }}
                >
                  {h.time}
                </span>
              )}
            </>
          );

          if (editing) {
            return (
              <li key={h.id} className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-canvas pe-1 ps-3">
                {body}
                {cal}
                <IconButton label="עריכת הרגל" onClick={() => onEdit(h)}>
                  <Pencil size={18} />
                </IconButton>
                <IconButton
                  label="מחיקת הרגל"
                  onClick={() => confirm(`למחוק את "${h.name}" ואת כל ההיסטוריה שלו?`) && deleteHabit(h.id!)}
                >
                  <Trash2 size={18} />
                </IconButton>
              </li>
            );
          }
          if (!due) {
            return (
              <li key={h.id} className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-canvas px-3 opacity-55">
                <span className="h-7 w-7 shrink-0 rounded-full border-2 border-dashed border-line" aria-hidden />
                {body}
                {cal}
              </li>
            );
          }
          return (
            <li key={h.id} className="flex items-center gap-1">
              <button
                onClick={() => onToggle(h.id!)}
                className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 px-3 text-start transition active:scale-[0.98]"
                style={{
                  borderColor: done ? h.color : 'transparent',
                  background: done ? `${h.color}14` : 'rgb(var(--canvas))',
                }}
              >
                <CheckCircle checked={done} color={h.color} />
                {body}
              </button>
              {cal}
            </li>
          );
        })}
      </ul>
      <form onSubmit={quickAdd} className="flex gap-2">
        <input
          className="input"
          placeholder="הרגל חדש…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="הרגל חדש"
        />
        <button
          type="submit"
          aria-label="הוסף הרגל"
          className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-40"
        >
          <Plus size={22} />
        </button>
      </form>
    </div>
  );
}

const WEEK_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

/** Seven small circles for the week; the habit's days are filled with its color. */
function WeekStrip({ habit }: { habit: Habit }) {
  const everyDay = !habit.days.length || habit.days.length === 7;
  return (
    <span className="flex gap-1" role="img" aria-label={describeDays(habit)}>
      <span className="sr-only">{describeDays(habit)}</span>
      {WEEK_LETTERS.map((letter, i) => {
        const on = everyDay || habit.days.includes(i as Weekday);
        return (
          <span
            key={letter}
            aria-hidden
            className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold leading-none"
            style={on ? { background: habit.color, color: '#fff' } : { background: 'rgb(var(--line))', color: 'rgb(var(--muted))' }}
          >
            {letter}
          </span>
        );
      })}
    </span>
  );
}
