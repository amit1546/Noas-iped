import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, PageHeader } from '../components/ui';
import { useHabitLogsBetween, useHabits, useMealsBetween, useSettings, useTasksBetween } from '../db/queries';
import type { ISODate } from '../db/schema';
import { formatLong, fromISO, rangeISO, shiftISO, toISO, todayISO } from '../lib/dates';
import { useSelectedDate } from '../lib/selectedDate';
import { calorieStatus, sumMeals } from '../lib/stats';
import { isScheduled } from '../lib/streaks';

const DOT = {
  tasks: '#6366f1',
  habits: '#3b82f6',
  foodOk: '#06b6d4',
  foodOver: '#ef4444',
};

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

interface DaySummary {
  tasksTotal: number;
  tasksDone: number;
  habitsTotal: number;
  habitsDone: number;
  calories: number;
}

export function CalendarPage() {
  const [selected, setSelected] = useSelectedDate();
  const [month, setMonth] = useState(() => startOfMonth(fromISO(selected)));
  const navigate = useNavigate();
  const { calorieGoal } = useSettings();
  const today = todayISO();

  const first = toISO(month);
  const last = toISO(endOfMonth(month));
  // Grid starts on the Sunday on/before the 1st and covers whole weeks.
  const gridStart = shiftISO(first, -month.getDay());
  const weeks = Math.ceil((month.getDay() + endOfMonth(month).getDate()) / 7);
  const cells = rangeISO(gridStart, weeks * 7);

  const tasks = useTasksBetween(first, last);
  const logs = useHabitLogsBetween(first, last);
  const meals = useMealsBetween(first, last);
  const habits = useHabits();

  const summaries = useMemo(() => {
    const m = new Map<ISODate, DaySummary>();
    for (const d of rangeISO(first, endOfMonth(month).getDate())) {
      const dayTasks = tasks.filter((t) => t.date === d);
      const doneIds = new Set(logs.filter((l) => l.date === d).map((l) => l.habitId));
      // A habit counts for a day if it existed then, or was marked that day anyway.
      const sched = habits.filter((h) => doneIds.has(h.id!) || (isScheduled(h, d) && h.createdAt <= d));
      m.set(d, {
        tasksTotal: dayTasks.length,
        tasksDone: dayTasks.filter((t) => t.done).length,
        habitsTotal: sched.length,
        habitsDone: sched.filter((h) => doneIds.has(h.id!)).length,
        calories: sumMeals(meals.filter((x) => x.date === d)).calories,
      });
    }
    return m;
  }, [first, month, tasks, logs, meals, habits]);

  const sel = summaries.get(selected);

  return (
    <>
      <PageHeader title="לוח שנה" subtitle="כל החודש במבט אחד" accent="blue" icon={<CalendarDays />} />

      <Card className="p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            aria-label="חודש קודם"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-line/60 hover:text-ink"
          >
            <ChevronRight />
          </button>
          <h2 className="text-xl font-bold">{format(month, 'LLLL yyyy', { locale: he })}</h2>
          <button
            aria-label="חודש הבא"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-line/60 hover:text-ink"
          >
            <ChevronLeft />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-xs font-semibold text-muted">
              {d}
            </div>
          ))}
          {cells.map((d) => {
            const inMonth = d >= first && d <= last;
            const s = summaries.get(d);
            const isSel = d === selected;
            const isToday = d === today;
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                disabled={!inMonth}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl transition sm:aspect-[5/4] ${
                  isSel ? 'bg-blue-600 text-white shadow-soft' : inMonth ? 'hover:bg-canvas' : 'opacity-0'
                }`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-[15px] font-semibold tabular-nums ${
                    isToday && !isSel ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : ''
                  }`}
                >
                  {fromISO(d).getDate()}
                </span>
                <span className="mt-0.5 flex h-2 items-center gap-[3px]">
                  {s && <Dots s={s} goal={calorieGoal} onBlue={isSel} />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-muted">
          <Legend color={DOT.tasks} label="משימות" />
          <Legend color={DOT.habits} label="הרגלים" />
          <Legend color={DOT.foodOk} label="תזונה ביעד" />
          <Legend color={DOT.foodOver} label="מעל היעד" />
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border-[1.5px] border-muted" /> לא הושלם
          </span>
        </div>
      </Card>

      {sel && (
        <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold">{formatLong(selected)}</h3>
              <button
                className="btn bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"
                onClick={() => navigate('/')}
              >
                פתח את היום
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Mini label="משימות" value={sel.tasksTotal ? `${sel.tasksDone}/${sel.tasksTotal}` : '—'} color={DOT.tasks} />
              <Mini label="הרגלים" value={sel.habitsTotal ? `${sel.habitsDone}/${sel.habitsTotal}` : '—'} color={DOT.habits} />
              <Mini
                label="קלוריות"
                value={sel.calories ? sel.calories.toLocaleString('he-IL') : '—'}
                color={calorieStatus(sel.calories, calorieGoal) === 'over' ? DOT.foodOver : DOT.foodOk}
              />
            </div>
          </Card>
        </motion.div>
      )}
    </>
  );
}

/** Filled dot = completed, hollow ring = there was something but not completed. */
function Dots({ s, goal, onBlue }: { s: DaySummary; goal: number; onBlue: boolean }) {
  const dots: { color: string; filled: boolean }[] = [];
  if (s.tasksTotal) dots.push({ color: DOT.tasks, filled: s.tasksDone === s.tasksTotal });
  if (s.habitsDone) dots.push({ color: DOT.habits, filled: s.habitsDone === s.habitsTotal });
  if (s.calories) dots.push({ color: calorieStatus(s.calories, goal) === 'over' ? DOT.foodOver : DOT.foodOk, filled: true });
  return (
    <>
      {dots.map((d, i) => {
        const c = onBlue ? '#fff' : d.color;
        return (
          <span
            key={i}
            className="h-[7px] w-[7px] rounded-full"
            style={{ background: d.filled ? c : 'transparent', border: `1.5px solid ${c}` }}
          />
        );
      })}
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-canvas p-3">
      <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </p>
      <p className="mt-0.5 text-xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}
