import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { addHabit, deleteHabit, toggleHabit, useAllHabitLogs, useHabits } from '../db/queries';
import type { Habit, ISODate } from '../db/schema';
import { HABIT_COLORS } from '../lib/accent';
import { todayISO } from '../lib/dates';
import { currentStreak, isScheduled } from '../lib/streaks';
import { useCelebrate } from './Confetti';
import { CheckCircle, IconButton } from './ui';

export function HabitChecklist({
  date,
  editing,
  onEdit,
}: {
  date: ISODate;
  editing: boolean;
  onEdit: (h: Habit) => void;
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

  const scheduled = editing ? habits : habits.filter((h) => isScheduled(h, date));

  const onToggle = async (habitId: number) => {
    const nowDone = await toggleHabit(habitId, date);
    if (!nowDone) return;
    const doneCount = scheduled.filter((h) => h.id === habitId || doneByHabit.get(h.id!)?.has(date)).length;
    if (doneCount === scheduled.length) celebrate('כל ההרגלים של היום הושלמו! 🎉');
  };

  // Quick add: just a name; emoji/color/days can be tweaked later via edit.
  const quickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    await addHabit({
      name: n,
      emoji: '✨',
      color: HABIT_COLORS[habits.length % HABIT_COLORS.length],
      days: [],
      archived: false,
      createdAt: todayISO(),
    });
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
                <span className="flex-1 font-semibold">{h.name}</span>
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
                  {streak > 1 && <span className="text-xs text-muted">{streak} ימים ברצף</span>}
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
          placeholder={habits.length ? 'הרגל חדש…' : 'הרגל ראשון — לדוגמה: קריאה 20 דקות'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="הרגל חדש"
        />
        <button
          type="submit"
          aria-label="הוסף הרגל"
          className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-40"
          disabled={!name.trim()}
        >
          <Plus size={22} />
        </button>
      </form>
    </div>
  );
}
