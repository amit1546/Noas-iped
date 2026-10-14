import { Flame } from 'lucide-react';
import { useMemo } from 'react';
import { toggleHabit, useAllHabitLogs, useHabits } from '../db/queries';
import type { ISODate } from '../db/schema';
import { currentStreak, isScheduled } from '../lib/streaks';
import { useCelebrate } from './Confetti';
import { CheckCircle, EmptyState } from './ui';

export function HabitChecklist({ date, onAdd }: { date: ISODate; onAdd?: () => void }) {
  const habits = useHabits();
  const logs = useAllHabitLogs();
  const celebrate = useCelebrate();

  const doneByHabit = useMemo(() => {
    const m = new Map<number, Set<ISODate>>();
    for (const l of logs) {
      if (!m.has(l.habitId)) m.set(l.habitId, new Set());
      m.get(l.habitId)!.add(l.date);
    }
    return m;
  }, [logs]);

  const scheduled = habits.filter((h) => isScheduled(h, date));

  if (!habits.length) {
    return (
      <EmptyState
        emoji="🌱"
        title="עוד אין הרגלים"
        text="הרגל קטן כל יום — שתיית מים, קריאה, מתיחות…"
        action={
          onAdd && (
            <button className="btn bg-violet-600 text-white" onClick={onAdd}>
              הוסף הרגל ראשון
            </button>
          )
        }
      />
    );
  }
  if (!scheduled.length) return <p className="py-4 text-center text-muted">אין הרגלים מתוכננים ליום הזה 😌</p>;

  const onToggle = async (habitId: number) => {
    const nowDone = await toggleHabit(habitId, date);
    if (!nowDone) return;
    const doneCount = scheduled.filter((h) => h.id === habitId || doneByHabit.get(h.id!)?.has(date)).length;
    if (doneCount === scheduled.length) celebrate('כל ההרגלים של היום הושלמו! 🎉');
  };

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {scheduled.map((h) => {
        const dates = doneByHabit.get(h.id!) ?? new Set<ISODate>();
        const done = dates.has(date);
        const streak = currentStreak(h, dates, date);
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
              <span className="text-2xl">{h.emoji}</span>
              <span className="flex-1 font-semibold">{h.name}</span>
              {streak > 0 && (
                <span className="flex items-center gap-0.5 text-sm font-bold text-orange-500">
                  <Flame size={16} fill="currentColor" />
                  {streak}
                </span>
              )}
              <CheckCircle checked={done} color={h.color} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
