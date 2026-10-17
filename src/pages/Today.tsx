import { motion } from 'framer-motion';
import {
  Apple,
  ArrowLeftCircle,
  Bell,
  CalendarRange,
  Check,
  ChevronLeft,
  Dumbbell,
  Flame,
  ListChecks,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCelebrate } from '../components/Confetti';
import { CalendarExportButton } from '../components/CalendarExport';
import { CalorieBar } from '../components/CalorieBar';
import { WorkBadge } from '../components/WorkBadge';
import { MealDetails } from '../components/MealDetails';
import { Card, CheckCircle } from '../components/ui';
import { exportBackup, saveBackup } from '../db/backup';
import { db } from '../db/db';
import {
  deleteTask,
  moveTask,
  setWorkoutDone,
  toggleHabit,
  toggleTask,
  updateMeal,
  updateSettings,
  useAllHabitLogs,
  useBodyWeights,
  useHabits,
  useHasData,
  useMeals,
  useOverdueTasks,
  useReminders,
  useSettings,
  useTasks,
  useWorkoutsOn,
} from '../db/queries';
import { isWorkoutDone } from '../db/schema';
import { formatLong, formatShort, greeting, todayISO } from '../lib/dates';
import { KIND_COLORS } from '../lib/kinds';
import { nutritionText } from '../lib/mealText';
import { quoteOfDay } from '../lib/quotes';
import { sumMeals } from '../lib/stats';
import { amountText } from '../lib/amount';
import { daysSince } from '../lib/reminder';
import { isScheduled } from '../lib/streaks';

type Kind = 'task' | 'habit' | 'workout' | 'meal' | 'reminder';

interface Item {
  key: string;
  kind: Kind;
  title: ReactNode;
  sub?: string;
  time?: string;
  done: boolean;
  toggle: () => Promise<unknown>;
  /** A note to remember: nothing to check off, and it doesn't count toward "all done". */
  note?: boolean;
  /** What's in a meal, one ingredient per line */
  details?: string;
}

const KIND: Record<Kind, { label: string; color: string; icon: ReactNode }> = {
  task: { label: 'משימה', color: KIND_COLORS.task, icon: <ListChecks size={14} /> },
  habit: { label: 'הרגל', color: KIND_COLORS.habit, icon: <Flame size={14} /> },
  workout: { label: 'אימון', color: KIND_COLORS.workout, icon: <Dumbbell size={14} /> },
  meal: { label: 'ארוחה', color: KIND_COLORS.meal, icon: <Apple size={14} /> },
  reminder: { label: 'תזכורת', color: KIND_COLORS.reminder, icon: <Bell size={14} /> },
};

export function Today() {
  const date = todayISO();
  const tasks = useTasks(date);
  const habits = useHabits();
  const logs = useAllHabitLogs();
  const workouts = useWorkoutsOn(date);
  const meals = useMeals(date);
  const reminders = useReminders(date);
  const weights = useBodyWeights();
  const celebrate = useCelebrate();
  const overdue = useOverdueTasks(date);
  const settings = useSettings();
  const hasData = useHasData();
  const backupDue = hasData && (!settings.lastBackupAt || daysSince(settings.lastBackupAt, date) >= 7);

  const backupNow = async () => {
    if (await saveBackup(await exportBackup(db))) await updateSettings({ lastBackupAt: date });
  };

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
          sub: [amountText(m), nutritionText(m)].filter(Boolean).join(' · ') || undefined,
          details: m.details,
          time: m.time,
          done: !m.planned,
          toggle: () => updateMeal(m.id!, { planned: !m.planned }),
        })),
      ...reminders.map((r) => ({
        key: `r${r.id}`,
        kind: 'reminder' as const,
        title: r.text,
        time: r.time,
        done: false,
        note: true,
        toggle: async () => {},
      })),
    ];
    return list.sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
  }, [tasks, habits, logs, workouts, meals, reminders, date]);

  const checkable = items.filter((i) => !i.note);
  const doneCount = checkable.filter((i) => i.done).length;
  const timed = items.filter((i) => i.time);
  const untimed = items.filter((i) => !i.time);

  const onToggle = async (item: Item) => {
    await item.toggle();
    if (!item.done && doneCount + 1 === checkable.length) celebrate('סיימת את כל מה שתכננת להיום! 🎉');
  };

  return (
    <>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{greeting()} 👋</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            {formatLong(date)}
            <WorkBadge date={date} />
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-muted">
            <Sparkles size={16} className="shrink-0 text-amber-500" />
            {quoteOfDay(date)}
          </p>
        </div>
        <Link
          to="/settings"
          aria-label="הגדרות"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-line/60 lg:hidden"
        >
          <Settings size={22} />
        </Link>
      </header>

      {weighDue && (
        <Link
          to="/dashboard"
          className="mb-5 flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <Scale size={20} className="shrink-0" />
          <span className="flex-1 text-sm font-semibold">
            {lastWeigh ? `עבר שבוע מהשקילה האחרונה (${formatShort(lastWeigh.date)}) — זמן להישקל` : 'עוד לא נשקלת — כדאי להתחיל לעקוב'}
          </span>
          <ChevronLeft size={18} />
        </Link>
      )}

      {backupDue && (
        <button
          onClick={backupNow}
          className="mb-5 flex w-full items-center gap-3 rounded-3xl border border-blue-200 bg-blue-50 px-4 py-3 text-start text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
        >
          <ShieldCheck size={20} className="shrink-0" />
          <span className="flex-1 text-sm font-semibold">
            {settings.lastBackupAt
              ? `עבר שבוע מהגיבוי האחרון (${formatShort(settings.lastBackupAt)}) — לגבות עכשיו?`
              : 'הנתונים שמורים רק במכשיר הזה — כדאי לגבות'}
          </span>
          <span className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">גבה</span>
        </button>
      )}

      {overdue.length > 0 && (
        <Card className="mb-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="font-bold">נשאר מימים קודמים</p>
            <button
              onClick={() => Promise.all(overdue.map((t) => moveTask(t.id!, date)))}
              className="chip text-sm font-semibold text-blue-600 dark:text-blue-400"
            >
              <ArrowLeftCircle size={15} /> הכול להיום
            </button>
          </div>
          <ul className="space-y-1.5">
            {overdue.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-2xl bg-canvas py-1.5 pe-1 ps-3">
                <span className="flex-1">
                  <span className="block font-semibold leading-tight">{t.title}</span>
                  <span className="text-xs text-muted">מ{formatLong(t.date)}</span>
                </span>
                <button
                  onClick={() => moveTask(t.id!, date)}
                  className="min-h-[40px] rounded-xl px-3 text-sm font-semibold text-white"
                  style={{ background: KIND_COLORS.task }}
                >
                  להיום
                </button>
                <button
                  onClick={() => toggleTask(t)}
                  aria-label={`סמן ${t.title} כבוצע`}
                  className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:text-ink"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => deleteTask(t.id!)}
                  aria-label={`מחק ${t.title}`}
                  className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:text-ink"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
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
          <Card>
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
              {(Object.keys(KIND) as Kind[]).map((k) => (
                <span key={k} className="flex items-center gap-1.5" style={{ color: KIND[k].color }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: KIND[k].color }} />
                  {KIND[k].label}
                </span>
              ))}
              <span className="ms-auto">
                <CalendarExportButton date={date} label="ליומן הטלפון" />
              </span>
            </div>
            {timed.length > 0 && <Section title="לפי שעות" items={timed} onToggle={onToggle} />}
            {untimed.length > 0 && (
              <div className={timed.length ? 'mt-5' : ''}>
                <Section title={timed.length ? 'במהלך היום' : 'להיום'} items={untimed} onToggle={onToggle} />
              </div>
            )}
          </Card>
        </>
      )}

      <CalorieBar totals={sumMeals(meals)} planned={meals.filter((m) => m.planned).reduce((a, m) => a + m.calories, 0)} />
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
              {item.note ? (
                <div
                  className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-2 border-s-[6px] px-3"
                  style={{ borderColor: `${k.color}30`, borderInlineStartColor: k.color, background: `${k.color}0d` }}
                >
                  <Bell size={22} className="shrink-0" style={{ color: k.color }} />
                  {item.time && (
                    <span className="w-12 shrink-0 text-sm font-bold tabular-nums" style={{ color: k.color }}>
                      {item.time}
                    </span>
                  )}
                  <span className="flex-1 font-semibold">{item.title}</span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: k.color }}>
                    {k.icon}
                    {k.label}
                  </span>
                </div>
              ) : (
              <button
                onClick={() => onToggle(item)}
                className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-2 border-s-[6px] px-3 text-start transition active:scale-[0.99]"
                style={{
                  borderColor: item.done ? k.color : `${k.color}30`,
                  borderInlineStartColor: k.color,
                  background: item.done ? `${k.color}1f` : `${k.color}0d`,
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
                  className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ background: k.color }}
                >
                  {k.icon}
                  {k.label}
                </span>
              </button>
              )}
              <MealDetails details={item.details} className="px-3 pt-1.5 pb-0.5" />
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
