import { motion } from 'framer-motion';
import { Apple, CalendarRange, ChevronLeft, Dumbbell, Flame, ListChecks, Scale, Settings, Sparkles } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCelebrate } from '../components/Confetti';
import { ProgressRing } from '../components/ProgressRing';
import { Card, CheckCircle } from '../components/ui';
import {
  setWorkoutDone,
  toggleHabit,
  toggleTask,
  updateMeal,
  useAllHabitLogs,
  useBodyWeights,
  useHabits,
  useMeals,
  useTasks,
  useWorkoutsOn,
} from '../db/queries';
import { isWorkoutDone } from '../db/schema';
import { formatLong, formatShort, greeting, hebrewDate, todayISO } from '../lib/dates';
import { quoteOfDay } from '../lib/quotes';
import { daysSince } from '../lib/reminder';
import { isScheduled } from '../lib/streaks';

type Kind = 'task' | 'habit' | 'workout' | 'meal';

interface Item {
  key: string;
  kind: Kind;
  title: ReactNode;
  sub?: string;
  time?: string;
  done: boolean;
  toggle: () => Promise<unknown>;
}

const KIND: Record<Kind, { label: string; color: string; icon: ReactNode }> = {
  task: { label: 'משימה', color: '#6366f1', icon: <ListChecks size={14} /> },
  habit: { label: 'הרגל', color: '#3b82f6', icon: <Flame size={14} /> },
  workout: { label: 'אימון', color: '#2563eb', icon: <Dumbbell size={14} /> },
  meal: { label: 'ארוחה', color: '#0ea5e9', icon: <Apple size={14} /> },
};

export function Today() {
  const date = todayISO();
  const tasks = useTasks(date);
  const habits = useHabits();
  const logs = useAllHabitLogs();
  const workouts = useWorkoutsOn(date);
  const meals = useMeals(date);
  const weights = useBodyWeights();
  const celebrate = useCelebrate();

  const lastWeigh = weights[weights.length - 1];
  const weighDue = !lastWeigh || daysSince(lastWeigh.date, date) >= 7;

  const items = useMemo<Item[]>(() => {
    const doneHabits = new Set(logs.filter((l) => l.date === date).map((l) => l.habitId));
    const list: Item[] = [
      ...tasks.map((t) => ({
        key: `t${t.id}`,
        kind: 'task' as const,
        title: t.title,
        time: t.time,
        done: t.done,
        toggle: () => toggleTask(t),
      })),
      ...habits
        .filter((h) => isScheduled(h, date))
        .map((h) => ({
          key: `h${h.id}`,
          kind: 'habit' as const,
          title: (
            <>
              <span className="me-1.5">{h.emoji}</span>
              {h.name}
            </>
          ),
          time: h.time,
          done: doneHabits.has(h.id!),
          toggle: () => toggleHabit(h.id!, date),
        })),
      ...workouts.map((w) => ({
        key: `w${w.id}`,
        kind: 'workout' as const,
        title: w.title || 'אימון',
        time: w.time,
        done: isWorkoutDone(w),
        toggle: () => setWorkoutDone(w.id!, !isWorkoutDone(w)),
      })),
      ...meals
        .filter((m) => m.planned || m.fromPlan)
        .map((m) => ({
          key: `m${m.id}`,
          kind: 'meal' as const,
          title: m.name,
          sub: `${m.calories} קל׳`,
          time: m.time,
          done: !m.planned,
          toggle: () => updateMeal(m.id!, { planned: !m.planned }),
        })),
    ];
    return list.sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
  }, [tasks, habits, logs, workouts, meals, date]);

  const doneCount = items.filter((i) => i.done).length;
  const timed = items.filter((i) => i.time);
  const untimed = items.filter((i) => !i.time);

  const onToggle = async (item: Item) => {
    await item.toggle();
    if (!item.done && doneCount + 1 === items.length) celebrate('סיימת את כל מה שתכננת להיום! 🎉');
  };

  return (
    <>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{greeting()} 👋</h1>
          <p className="mt-1 text-sm text-muted">
            {formatLong(date)} · {hebrewDate(date)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-muted">
            <Sparkles size={16} className="shrink-0 text-amber-500" />
            {quoteOfDay(date)}
          </p>
        </div>
        <Link
          to="/settings"
          aria-label="הגדרות"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-line/60 md:hidden"
        >
          <Settings size={22} />
        </Link>
      </header>

      {weighDue && (
        <Link
          to="/nutrition"
          className="mb-5 flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <Scale size={20} className="shrink-0" />
          <span className="flex-1 text-sm font-semibold">
            {lastWeigh ? `עבר שבוע מהשקילה האחרונה (${formatShort(lastWeigh.date)}) — זמן להישקל` : 'עוד לא נשקלת — כדאי להתחיל לעקוב'}
          </span>
          <ChevronLeft size={18} />
        </Link>
      )}

      {items.length === 0 ? (
        <Card className="text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-canvas text-3xl">🗓️</div>
          <p className="font-semibold">עוד לא תכננת כלום להיום</p>
          <p className="mt-1 text-sm text-muted">משימות, הרגלים, אימונים וארוחות מוסיפים במסך התכנון</p>
          <Link to="/plan" className="btn mt-4 bg-blue-600 text-white hover:bg-blue-700">
            <CalendarRange size={18} /> לתכנון היום
          </Link>
        </Card>
      ) : (
        <>
          <Card className="mb-5 flex items-center gap-4">
            <ProgressRing value={doneCount} max={items.length} size={76} stroke={9} color="#2563eb">
              <span className="text-lg font-extrabold tabular-nums">
                {doneCount}/{items.length}
              </span>
            </ProgressRing>
            <div className="flex-1">
              <p className="text-lg font-bold">
                {doneCount === items.length ? 'הכול הושלם! 🎉' : `נשארו ${items.length - doneCount} דברים להיום`}
              </p>
              <Link to="/plan" className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                לעריכת התכנון <ChevronLeft size={16} />
              </Link>
            </div>
          </Card>

          <Card>
            {timed.length > 0 && <Section title="לפי שעות" items={timed} onToggle={onToggle} />}
            {untimed.length > 0 && (
              <div className={timed.length ? 'mt-5' : ''}>
                <Section title={timed.length ? 'במהלך היום' : 'להיום'} items={untimed} onToggle={onToggle} />
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}

function Section({ title, items, onToggle }: { title: string; items: Item[]; onToggle: (i: Item) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-muted">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const k = KIND[item.kind];
          return (
            <motion.li key={item.key} layout>
              <button
                onClick={() => onToggle(item)}
                className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-2 px-3 text-start transition active:scale-[0.99]"
                style={{
                  borderColor: item.done ? k.color : 'transparent',
                  background: item.done ? `${k.color}10` : 'rgb(var(--canvas))',
                }}
              >
                <CheckCircle checked={item.done} color={k.color} />
                {item.time && (
                  <span className="w-12 shrink-0 text-sm font-bold tabular-nums" style={{ color: k.color }}>
                    {item.time}
                  </span>
                )}
                <span className={`flex-1 font-semibold ${item.done ? 'text-muted line-through' : ''}`}>{item.title}</span>
                {item.sub && <span className="text-sm text-muted">{item.sub}</span>}
                <span
                  className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                  style={{ color: k.color, background: `${k.color}18` }}
                >
                  {k.icon}
                  {k.label}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
