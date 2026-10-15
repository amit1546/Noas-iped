import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { deleteHabit, toggleHabit, useAllHabitLogs, useHabits } from '../db/queries';
import type { Habit, ISODate } from '../db/schema';
import { describeDays } from '../lib/habitText';
import { currentStreak, isScheduled } from '../lib/streaks';
import { useCelebrate } from './Confetti';
import { CheckCircle, IconButton } from './ui';

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
      <ul className="mb-3 grid gap-2 sm:grid-cols-2">
        {sorted.map((h) => {
          const dates = doneByHabit.get(h.id!) ?? new Set<ISODate>();
          const due = isScheduled(h, date);
          const done = due && dates.has(date);
          const streak = due ? currentStreak(h, dates, date) : 0;
          const info = (
            <>
              <span className="text-xl">{h.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold leading-tight">{h.name}</span>
                <span className="text-xs text-muted">
                  {describeDays(h)}
                  {streak > 1 ? ` · ${streak} ימים ברצף` : ''}
                  {!due && !editing ? ' · לא ביום הזה' : ''}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums ${
                  h.time ? '' : 'text-xs font-medium text-muted'
                }`}
                style={h.time ? { color: h.color, background: `${h.color}1a` } : undefined}
              >
                {h.time ?? 'ללא שעה'}
              </span>
            </>
          );

          if (editing) {
            return (
              <li key={h.id} className="flex min-h-[60px] items-center gap-2 rounded-2xl bg-canvas pe-1 ps-3">
                {info}
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
              <li key={h.id} className="flex min-h-[60px] items-center gap-3 rounded-2xl bg-canvas px-3 opacity-55">
                {info}
              </li>
            );
          }
          return (
            <li key={h.id}>
              <button
                onClick={() => onToggle(h.id!)}
                className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-2 px-3 text-start transition active:scale-[0.98]"
                style={{
                  borderColor: done ? h.color : 'transparent',
                  background: done ? `${h.color}14` : 'rgb(var(--canvas))',
                }}
              >
                {info}
                <CheckCircle checked={done} color={h.color} />
              </button>
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
