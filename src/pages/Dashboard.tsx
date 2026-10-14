import { Activity, Apple, Check, Dumbbell, Flame, LayoutDashboard, Scale } from 'lucide-react';
import { isWorkoutDone } from '../db/schema';
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
import { Card, CardTitle, EmptyState, PageHeader } from '../components/ui';
import { WeightEntry } from '../components/WeightCard';
import {
  useAllHabitLogs,
  useBodyWeights,
  useHabits,
  useMealsBetween,
  useSettings,
  useWorkoutsBetween,
} from '../db/queries';
import { formatShort, rangeISO, shiftISO, todayISO, weekdayShort } from '../lib/dates';
import { isScheduled } from '../lib/streaks';
import { sumMeals } from '../lib/stats';

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
  const workouts = useWorkoutsBetween(from, today);
  const workoutLog = [...workouts].sort((a, b) => b.date.localeCompare(a.date) || (b.time ?? '').localeCompare(a.time ?? ''));
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

  return (
    <>
      <PageHeader title="סיכום" subtitle="7 הימים האחרונים" accent="sky" icon={<LayoutDashboard />} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle title="יומן אימונים" icon={<Dumbbell size={18} />} />
          {workoutLog.length ? (
            <ul className="space-y-1.5">
              {workoutLog.map((w) => {
                const done = isWorkoutDone(w);
                const missed = !done && w.date < today;
                return (
                  <li key={w.id} className="flex items-center gap-3 rounded-2xl bg-canvas px-3 py-2.5">
                    {missed ? (
                      <span className="grid h-7 w-7 shrink-0 place-items-center text-lg" title="התפספס">
                        ❌
                      </span>
                    ) : (
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                          done ? 'bg-blue-600 text-white' : 'border-2 border-line'
                        }`}
                      >
                        {done && <Check size={15} />}
                      </span>
                    )}
                    <span className={`flex-1 font-semibold ${done ? '' : 'text-muted'}`}>
                      {w.title || 'אימון'}
                      {missed && <span className="ms-2 text-xs text-red-500">התפספס</span>}
                    </span>
                    <span className="text-sm tabular-nums text-muted">
                      {weekdayShort(w.date)} {formatShort(w.date)}
                      {w.time ? ` · ${w.time}` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState emoji="💪" title="אין אימונים ב-7 הימים האחרונים" text="מוסיפים אימון בכרטיס האימונים במסך היום" />
          )}
        </Card>

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
            <EmptyState emoji="⚖️" title="רשום משקל לפחות פעמיים כדי לראות מגמה" />
          )}
          <div className="mt-4 border-t border-line pt-3">
            <WeightEntry />
          </div>
        </Card>

      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted">
        <Activity size={14} /> הנתונים נשמרים במכשיר הזה בלבד — זכור לגבות בהגדרות
      </p>
    </>
  );
}


