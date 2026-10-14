import { Activity, Apple, Check, Dumbbell, Flame, LayoutDashboard, Scale } from 'lucide-react';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardTitle, EmptyState, PageHeader, Stat } from '../components/ui';
import {
  toggleWorkoutDay,
  useAllHabitLogs,
  useBodyWeights,
  useHabits,
  useMealsBetween,
  useSettings,
  useTasksBetween,
  useWorkoutsBetween,
} from '../db/queries';
import { formatShort, rangeISO, shiftISO, todayISO, weekdayShort } from '../lib/dates';
import { isScheduled } from '../lib/streaks';
import { average, sumMeals } from '../lib/stats';

const tooltipStyle = {
  contentStyle: {
    background: 'rgb(var(--surface))',
    border: '1px solid rgb(var(--line))',
    borderRadius: 16,
    color: 'rgb(var(--ink))',
    direction: 'rtl' as const,
  },
};
const axisProps = { stroke: 'rgb(var(--muted))', fontSize: 12, tickLine: false, axisLine: false };

export function Dashboard() {
  const today = todayISO();
  const from = shiftISO(today, -6);
  const days = rangeISO(from, 7);
  const settings = useSettings();
  const habits = useHabits();
  const logs = useAllHabitLogs();
  const meals = useMealsBetween(from, today);
  const tasks = useTasksBetween(from, today);
  const workouts = useWorkoutsBetween(from, today);
  const workoutDays = new Set(workouts.map((w) => w.date));
  const weights = useBodyWeights();

  const habitDays = useMemo(() => {
    const logSet = new Set(logs.map((l) => `${l.habitId}|${l.date}`));
    return days.map((d) => {
      const sched = habits.filter((h) => logSet.has(`${h.id}|${d}`) || (isScheduled(h, d) && h.createdAt <= d));
      const done = sched.filter((h) => logSet.has(`${h.id}|${d}`)).length;
      return { day: weekdayShort(d), pct: sched.length ? Math.round((done / sched.length) * 100) : 0, total: sched.length };
    });
  }, [days.join(), habits, logs]);

  const calorieDays = days.map((d) => ({
    day: weekdayShort(d),
    calories: sumMeals(meals.filter((m) => m.date === d)).calories,
  }));
  const loggedCalorieDays = calorieDays.filter((d) => d.calories > 0);


  const weightData = weights.slice(-30).map((w) => ({ date: formatShort(w.date), kg: w.kg }));
  const habitAvg = Math.round(average(habitDays.filter((d) => d.total > 0).map((d) => d.pct)));

  return (
    <>
      <PageHeader title="סיכום" subtitle="7 הימים האחרונים" accent="sky" icon={<LayoutDashboard />} />

      <WorkoutsTile days={days} done={workoutDays} today={today} />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="השלמת הרגלים" value={`${habitAvg}%`} />
        <Stat label="משימות שהושלמו" value={`${tasks.filter((t) => t.done).length}/${tasks.length}`} />
        <Stat
          label="ממוצע קלוריות"
          value={Math.round(average(loggedCalorieDays.map((d) => d.calories))).toLocaleString('he-IL')}
          sub={`יעד: ${settings.calorieGoal.toLocaleString('he-IL')}`}
        />
        <Stat
          label="משקל אחרון"
          value={weights.length ? weights[weights.length - 1].kg : '—'}
          sub={weights.length > 1 ? diffLabel(weights[weights.length - 1].kg - weights[0].kg) : 'ק״ג'}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle title="הרגלים — % השלמה יומי" icon={<Flame size={18} />} />
          {habits.length ? (
            <div className="h-56" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={[...habitDays].reverse()} maxBarSize={44}>
                  <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                  <XAxis dataKey="day" {...axisProps} />
                  <YAxis domain={[0, 100]} {...axisProps} width={32} orientation="right" />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'הושלם']} cursor={{ fill: 'rgb(var(--line) / 0.4)' }} />
                  <Bar dataKey="pct" radius={[10, 10, 4, 4]}>
                    {[...habitDays].reverse().map((d, i) => (
                      <Cell key={i} fill={d.pct === 100 ? '#3b82f6' : '#93c5fd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState emoji="📊" title="הוסף הרגלים כדי לראות גרף" />
          )}
        </Card>

        <Card>
          <CardTitle title="קלוריות מול יעד" accent="sky" icon={<Apple size={18} />} />
          {loggedCalorieDays.length ? (
            <div className="h-56" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={[...calorieDays].reverse()} maxBarSize={44}>
                  <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                  <XAxis dataKey="day" {...axisProps} />
                  <YAxis {...axisProps} width={42} orientation="right" />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} קל׳`, 'נאכל']} cursor={{ fill: 'rgb(var(--line) / 0.4)' }} />
                  <ReferenceLine y={settings.calorieGoal} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={2} />
                  <Bar dataKey="calories" radius={[10, 10, 4, 4]}>
                    {[...calorieDays].reverse().map((d, i) => (
                      <Cell key={i} fill={d.calories > settings.calorieGoal ? '#ef4444' : '#06b6d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState emoji="🥗" title="עוד אין נתוני תזונה השבוע" />
          )}
        </Card>

        <Card>
          <CardTitle title="משקל גוף" accent="blue" icon={<Scale size={18} />} />
          {weightData.length > 1 ? (
            <div className="h-56" dir="ltr">
              <ResponsiveContainer>
                <LineChart data={[...weightData].reverse()}>
                  <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                  <XAxis dataKey="date" {...axisProps} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} {...axisProps} width={36} orientation="right" />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} ק״ג`, 'משקל']} />
                  <Line type="monotone" dataKey="kg" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState emoji="⚖️" title="רשום משקל לפחות פעמיים כדי לראות מגמה" text="אפשר לעשות את זה במסך התזונה" />
          )}
        </Card>

      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted">
        <Activity size={14} /> הנתונים נשמרים במכשיר הזה בלבד — זכור לגבות בהגדרות
      </p>
    </>
  );
}

function diffLabel(d: number) {
  const r = Math.round(d * 10) / 10;
  if (r === 0) return 'ללא שינוי';
  return `${r > 0 ? '+' : ''}${r} ק״ג מההתחלה`;
}

function WorkoutsTile({ days, done, today }: { days: string[]; done: Set<string>; today: string }) {
  const doneToday = done.has(today);
  return (
    <div className="card mb-3 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          <Dumbbell size={22} />
        </span>
        <div className="flex-1">
          <p className="text-xs font-medium text-muted">אימונים שהשלמתי · 7 ימים</p>
          <p className="text-2xl font-extrabold tabular-nums">{done.size}</p>
        </div>
        <button
          onClick={() => toggleWorkoutDay(today)}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-2xl px-4 text-sm font-semibold transition active:scale-95 ${
            doneToday ? 'bg-blue-600 text-white' : 'border border-line text-ink'
          }`}
        >
          {doneToday ? <Check size={16} /> : <Dumbbell size={16} />}
          {doneToday ? 'התאמנתי היום' : 'סמן אימון היום'}
        </button>
      </div>
      <div className="mt-3 flex justify-between gap-1">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => toggleWorkoutDay(d)}
            aria-label={`אימון ב-${d}`}
            aria-pressed={done.has(d)}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span
              className={`grid h-8 w-8 place-items-center rounded-full transition ${
                done.has(d) ? 'bg-blue-600 text-white' : 'bg-canvas text-muted'
              }`}
            >
              {done.has(d) ? <Check size={16} /> : null}
            </span>
            <span className={`text-[11px] ${d === today ? 'font-bold text-ink' : 'text-muted'}`}>{weekdayShort(d)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
