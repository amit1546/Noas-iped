import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { deleteHabit, toggleHabit, useAllHabitLogs, useHabits } from '../db/queries';
import type { Habit, ISODate } from '../db/schema';
import { currentStreak, isScheduled } from '../lib/streaks';
import { useCelebrate } from './Confetti';
import { CheckCircle, IconButton } from './ui';

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
  const scheduled = (editing ? habits : habits.filter((h) => isScheduled(h, date))).sort(byTime);

  const onToggle = async (habitId: number) => {
    const nowDone = await toggleHabit(habitId, date);
    if (!nowDone) return;
    const doneCount = scheduled.filter((h) => h.id === habitId || doneByHabit.get(h.id!)?.has(date)).length;
    if (doneCount === scheduled.length) celebrate('כל ההרגלים של היום הושלמו! 🎉');
  };

  const quickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name.trim());
    setName('');
  };

  return (
    <div>
      {habits.length > 0 && !scheduled.length && (
        <p className="pb-3 text-center text-sm text-muted">אין הרגלים מתוכננים ליום הזה 😌</p>
      )}
      <ul className="mb-3 grid gap-2 sm:grid-cols-2">
        {scheduled.map((h) => {
          const dates = doneByHabit.get(h.id!) ?? new Set<ISODate>();
          const done = dates.has(date);
          const streak = currentStreak(h, dates, date);
          if (editing) {
            return (
              <li key={h.id} className="flex min-h-[56px] items-center gap-2 rounded-2xl bg-canvas pe-1 ps-3">
                <span className="text-xl">{h.emoji}</span>
                <span className="flex-1">
                  <span className="block font-semibold leading-tight">{h.name}</span>
                  <span className="text-xs text-muted">
                    {describeDays(h)}
                    {h.time ? ` · ${h.time}` : ''}
                  </span>
                </span>
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
          return (
            <li key={h.id}>
              <button
                onClick={() => onToggle(h.id!)}
                className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border-2 px-3 text-start transition active:scale-[0.98]"
                style={{
                  borderColor: done ? h.color : 'transparent',
                  background: done ? `${h.color}14` : 'rgb(var(--canvas))',
                }}
              >
                <span className="text-xl">{h.emoji}</span>
                <span className="flex-1">
                  <span className="block font-semibold leading-tight">{h.name}</span>
                  {(h.time || streak > 1) && (
                    <span className="text-xs text-muted">
                      {h.time}
                      {h.time && streak > 1 ? ' · ' : ''}
                      {streak > 1 ? `${streak} ימים ברצף` : ''}
                    </span>
                  )}
                </span>
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

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
function describeDays(h: Habit) {
  if (!h.days.length) return 'כל יום';
  return h.days.map((d) => DAY_NAMES[d]).join(' ');
}
