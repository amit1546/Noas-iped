import { Apple, Check, Dumbbell, Flame, LayoutDashboard, Scale } from 'lucide-react';
import { isWorkoutDone } from '../db/schema';
import { useMemo, useState } from 'react';
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
import { Card, CardTitle, EmptyState, PageHeader, Segmented } from '../components/ui';
import { WeightEntry } from '../components/WeightCard';
import {
  useAllHabitLogs,
  useBodyWeights,
  useHabits,
  useMealsBetween,
  useSettings,
  useWorkoutsBetween,
} from '../db/queries';
import { ACCENT_300, ACCENT_500 } from '../lib/appearance';
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

type Range = 'week' | 'month' | '3m' | 'year';
const RANGES: Record<Range, { days: number; bucket: number; label: string; text: string }> = {
  week: { days: 7, bucket: 1, label: 'שבוע', text: '7 הימים האחרונים' },
  month: { days: 30, bucket: 1, label: 'חודש', text: '30 הימים האחרונים' },
  '3m': { days: 91, bucket: 7, label: '3 חודשים', text: '3 החודשים האחרונים, בממוצע שבועי' },
  year: { days: 360, bucket: 30, label: 'שנה', text: 'השנה האחרונה, בממוצע חודשי' },
};

export function Dashboard() {
  const today = todayISO();
  const [range, setRange] = useState<Range>('week');
  const cfg = RANGES[range];
  const from = shiftISO(today, -(cfg.days - 1));
  const days = rangeISO(from, cfg.days);
  const settings = useSettings();
  const habits = useHabits();
  const logs = useAllHabitLogs();
  const meals = useMealsBetween(from, today);
  const workouts = useWorkoutsBetween(from, today);
  const workoutLog = [...workouts].sort((a, b) => b.date.localeCompare(a.date) || (b.time ?? '').localeCompare(a.time ?? ''));
  const weights = useBodyWeights();

  // Groups of days: one per day for a week/month, one per week or month for longer ranges.
  const buckets = useMemo(() => {
    const out: { label: string; days: string[] }[] = [];
    for (let i = 0; i < days.length; i += cfg.bucket) {
      const group = days.slice(i, i + cfg.bucket);
      out.push({ label: cfg.bucket === 1 && range === 'week' ? weekdayShort(group[0]) : formatShort(group[0]), days: group });
    }
    return out;
  }, [days.join(), cfg.bucket, range]);

  const habitDays = useMemo(() => {
    const logSet = new Set(logs.map((l) => `${l.habitId}|${l.date}`));
    return buckets.map((b) => {
      let done = 0;
      let total = 0;
      for (const d of b.days) {
        const sched = habits.filter((h) => logSet.has(`${h.id}|${d}`) || (isScheduled(h, d) && h.createdAt <= d));
        total += sched.length;
        done += sched.filter((h) => logSet.has(`${h.id}|${d}`)).length;
      }
      return { day: b.label, pct: total ? Math.round((done / total) * 100) : 0, total };
    });
  }, [buckets, habits, logs]);

  // Calories: the average over the days that have meals logged.
  const calorieDays = buckets.map((b) => {
    const totals = b.days.map((d) => sumMeals(meals.filter((m) => m.date === d)).calories).filter((c) => c > 0);
    return { day: b.label, calories: totals.length ? Math.round(totals.reduce((x, y) => x + y, 0) / totals.length) : 0 };
  });
  const loggedCalorieDays = calorieDays.filter((d) => d.calories > 0);

  const weightData = weights.filter((w) => w.date >= from).map((w) => ({ date: formatShort(w.date), kg: w.kg }));
  const doneWorkouts = workouts.filter(isWorkoutDone).length;

  return (
    <>
      <PageHeader title="סיכום" subtitle={cfg.text} accent="sky" icon={<LayoutDashboard />} />
      <div className="mb-4">
        <Segmented<Range>
          value={range}
          onChange={setRange}
          options={(Object.keys(RANGES) as Range[]).map((r) => ({ value: r, label: RANGES[r].label }))}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle title={`יומן אימונים${workouts.length ? ` · ${doneWorkouts} מתוך ${workouts.length}` : ''}`} icon={<Dumbbell size={18} />} />
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
            <EmptyState emoji="💪" title="אין אימונים בתקופה הזאת" text="מוסיפים אימון בכרטיס האימונים במסך היום" />
          )}
        </Card>

        <Card>
          <CardTitle title="הרגלים — % השלמה יומי" icon={<Flame size={18} />} />
          {habits.length ? (
            <div className="h-56" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={[...habitDays].reverse()} maxBarSize={44}>
                  <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                  <XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} {...axisProps} width={32} orientation="right" />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'הושלם']} cursor={{ fill: 'rgb(var(--line) / 0.4)' }} />
                  <Bar dataKey="pct" radius={[10, 10, 4, 4]}>
                    {[...habitDays].reverse().map((d, i) => (
                      <Cell key={i} fill={d.pct === 100 ? ACCENT_500 : ACCENT_300} />
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
          <CardTitle title={range === '3m' || range === 'year' ? 'קלוריות מול יעד (ממוצע)' : 'קלוריות מול יעד'} accent="sky" icon={<Apple size={18} />} />
          {loggedCalorieDays.length ? (
            <div className="h-56" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={[...calorieDays].reverse()} maxBarSize={44}>
                  <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                  <XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" />
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
            <EmptyState emoji="🥗" title="אין נתוני תזונה בתקופה הזאת" />
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
                  <Line type="monotone" dataKey="kg" stroke={ACCENT_500} strokeWidth={3} dot={{ r: 4, fill: ACCENT_500 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState emoji="⚖️" title="צריך לפחות שתי מדידות משקל בתקופה הזאת" />
          )}
          <div className="mt-4 border-t border-line pt-3">
            <WeightEntry />
          </div>
        </Card>

      </div>

    </>
  );
}


