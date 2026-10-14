import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, PageHeader } from '../components/ui';
import { useHabitLogsBetween, useHabits, useMealsBetween, useTasksBetween, useWorkoutsBetween } from '../db/queries';
import { isWorkoutDone } from '../db/schema';
import type { ISODate } from '../db/schema';
import { fromISO, rangeISO, shiftISO, toISO, todayISO } from '../lib/dates';
import { useSelectedDate } from '../lib/selectedDate';
import { sumMeals } from '../lib/stats';
import { KIND_COLORS } from '../lib/kinds';
import { isScheduled } from '../lib/streaks';

const DOT = {
  tasks: KIND_COLORS.task,
  habits: KIND_COLORS.habit,
  workouts: KIND_COLORS.workout,
  foodOk: KIND_COLORS.meal,
};

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

interface DaySummary {
  tasksTotal: number;
  tasksDone: number;
  habitsTotal: number;
  habitsDone: number;
  workoutsTotal: number;
  workoutsDone: number;
  calories: number;
  plannedMeals: number;
}

export function CalendarPage() {
  const [selected, setSelected] = useSelectedDate();
  const [month, setMonth] = useState(() => startOfMonth(fromISO(selected)));
  const navigate = useNavigate();
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
  const workouts = useWorkoutsBetween(first, last);
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
        workoutsTotal: workouts.filter((w) => w.date === d).length,
        workoutsDone: workouts.filter((w) => w.date === d && isWorkoutDone(w)).length,
        calories: sumMeals(meals.filter((x) => x.date === d)).calories,
        plannedMeals: meals.filter((x) => x.date === d && x.planned).length,
      });
    }
    return m;
  }, [first, month, tasks, logs, meals, habits, workouts]);


  return (
    <>
      <PageHeader title="לוח שנה" subtitle="לחץ על יום כדי לתכנן אותו" accent="blue" icon={<CalendarDays />} />

      <Card className="p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            aria-label="חודש קודם"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-line/60 hover:text-ink"
          >
            <ChevronRight />
          </button>
          <h2 className="text-2xl font-extrabold">{format(month, 'LLLL yyyy', { locale: he })}</h2>
          <button
            aria-label="חודש הבא"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-line/60 hover:text-ink"
          >
            <ChevronLeft />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-sm font-bold text-muted">
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
                onClick={() => {
                  setSelected(d);
                  navigate('/plan');
                }}
                disabled={!inMonth}
                className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl transition active:scale-95 sm:min-h-[84px] ${
                  !inMonth
                    ? 'invisible'
                    : isToday
                      ? 'bg-blue-50 text-blue-700 ring-[3px] ring-blue-600 dark:bg-blue-500/15 dark:text-blue-200'
                      : isSel
                        ? 'bg-blue-50 ring-2 ring-blue-400 dark:bg-blue-500/10'
                        : d < today
                          ? 'bg-canvas'
                          : 'bg-canvas/50'
                }`}
              >
                <span className={`text-lg font-bold tabular-nums sm:text-xl ${d > today && !isToday ? 'text-muted' : ''}`}>
                  {fromISO(d).getDate()}
                </span>
                <span className="flex h-2.5 items-center gap-1">
                  {s && <Dots s={s} />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-line pt-3 text-sm text-muted">
          <Legend color={DOT.tasks} label="משימות" />
          <Legend color={DOT.habits} label="הרגלים" />
          <Legend color={DOT.workouts} label="אימונים" />
          <Legend color={DOT.foodOk} label="ארוחות" />
        </div>
      </Card>

    </>
  );
}

/** Filled dot = completed, hollow ring = there was something but not completed. */
function Dots({ s }: { s: DaySummary }) {
  const dots: { color: string; filled: boolean }[] = [];
  if (s.tasksTotal) dots.push({ color: DOT.tasks, filled: s.tasksDone === s.tasksTotal });
  if (s.habitsDone) dots.push({ color: DOT.habits, filled: s.habitsDone === s.habitsTotal });
  if (s.workoutsTotal) dots.push({ color: DOT.workouts, filled: s.workoutsDone === s.workoutsTotal });
  // Meals: filled once something was eaten, hollow while only planned.
  if (s.calories) dots.push({ color: DOT.foodOk, filled: true });
  else if (s.plannedMeals) dots.push({ color: DOT.foodOk, filled: false });
  return (
    <>
      {dots.map((d, i) => {
        const c = d.color;
        return (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: d.filled ? c : 'transparent', border: `2px solid ${c}` }}
          />
        );
      })}
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
