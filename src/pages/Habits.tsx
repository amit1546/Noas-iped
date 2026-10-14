import { Archive, ArchiveRestore, Flame, ListChecks, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DateNav } from '../components/DateNav';
import { Fab } from '../components/Fab';
import { HabitChecklist } from '../components/HabitChecklist';
import { HabitForm } from '../components/HabitForm';
import { TaskList } from '../components/TaskList';
import { Card, CardTitle, IconButton, PageHeader } from '../components/ui';
import { deleteHabit, updateHabit, useAllHabitLogs, useHabits } from '../db/queries';
import type { Habit, ISODate } from '../db/schema';
import { fromISO, rangeISO, shiftISO, todayISO } from '../lib/dates';
import { useSelectedDate } from '../lib/selectedDate';
import { bestStreak, currentStreak, isScheduled } from '../lib/streaks';

export function Habits() {
  const [date, setDate] = useSelectedDate();
  const habits = useHabits(true);
  const logs = useAllHabitLogs();
  const [editing, setEditing] = useState<Habit | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const doneByHabit = useMemo(() => {
    const m = new Map<number, Set<ISODate>>();
    for (const l of logs) {
      if (!m.has(l.habitId)) m.set(l.habitId, new Set());
      m.get(l.habitId)!.add(l.date);
    }
    return m;
  }, [logs]);

  const openNew = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const visible = habits.filter((h) => showArchived || !h.archived);
  const today = todayISO();

  return (
    <>
      <PageHeader title="משימות והרגלים" subtitle="כל יום עוד צעד קטן" accent="violet" icon={<ListChecks />} />
      <DateNav date={date} onChange={setDate} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle title="משימות" icon={<ListChecks size={18} />} />
          <TaskList date={date} />
        </Card>

        <Card>
          <CardTitle
            title="הרגלים"
            icon={<Flame size={18} />}
            action={
              <IconButton label="הרגל חדש" onClick={openNew}>
                <Plus />
              </IconButton>
            }
          />
          <HabitChecklist date={date} onAdd={openNew} />
        </Card>
      </div>

      {habits.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">ההרגלים שלי</h2>
            {habits.some((h) => h.archived) && (
              <button className="text-sm font-medium text-muted" onClick={() => setShowArchived((s) => !s)}>
                {showArchived ? 'הסתר ארכיון' : 'הצג ארכיון'}
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((h) => {
              const dates = doneByHabit.get(h.id!) ?? new Set<ISODate>();
              return (
                <Card key={h.id} className={h.archived ? 'opacity-60' : ''}>
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-2xl text-2xl"
                      style={{ background: `${h.color}22` }}
                    >
                      {h.emoji}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold">{h.name}</p>
                      <p className="text-xs text-muted">{describeDays(h)}</p>
                    </div>
                    <IconButton
                      label="עריכה"
                      onClick={() => {
                        setEditing(h);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton
                      label={h.archived ? 'שחזור מהארכיון' : 'העבר לארכיון'}
                      onClick={() => updateHabit(h.id!, { archived: !h.archived })}
                    >
                      {h.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                    </IconButton>
                    <IconButton
                      label="מחיקה"
                      onClick={() => confirm(`למחוק את "${h.name}" ואת כל ההיסטוריה שלו?`) && deleteHabit(h.id!)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </div>
                  <div className="mb-3 flex gap-4 text-sm">
                    <span className="flex items-center gap-1 font-semibold text-orange-500">
                      <Flame size={16} fill="currentColor" /> רצף: {currentStreak(h, dates, today)}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                      <Trophy size={16} /> שיא: {bestStreak(h, dates)}
                    </span>
                  </div>
                  <Heatmap habit={h} dates={dates} today={today} />
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <Fab accent="violet" label="הרגל חדש" onClick={openNew} />
      <HabitForm open={formOpen} onClose={() => setFormOpen(false)} habit={editing} />
    </>
  );
}

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
function describeDays(h: Habit) {
  if (!h.days.length) return 'כל יום';
  return h.days.map((d) => DAY_NAMES[d]).join(', ');
}

/** Last 5 weeks as a GitHub-style grid, columns = weeks (right-to-left), rows = weekdays. */
function Heatmap({ habit, dates, today }: { habit: Habit; dates: Set<ISODate>; today: ISODate }) {
  const weeks = 5;
  const end = shiftISO(today, 6 - fromISO(today).getDay());
  const start = shiftISO(end, -(weeks * 7 - 1));
  const days = rangeISO(start, weeks * 7);
  const cols = Array.from({ length: weeks }, (_, w) => days.slice(w * 7, w * 7 + 7));
  return (
    <div className="flex gap-1.5" dir="rtl">
      {cols.map((col, i) => (
        <div key={i} className="flex flex-1 flex-col gap-1.5">
          {col.map((d) => {
            const done = dates.has(d);
            const future = d > today;
            const sched = isScheduled(habit, d);
            return (
              <div
                key={d}
                title={d}
                className="aspect-square rounded-md"
                style={{
                  background: done ? habit.color : future || !sched ? 'transparent' : 'rgb(var(--line))',
                  border: future || !sched ? '1px dashed rgb(var(--line))' : undefined,
                  outline: d === today ? `2px solid ${habit.color}` : undefined,
                  outlineOffset: 1,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
