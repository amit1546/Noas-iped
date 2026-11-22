import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { Bell, Briefcase, CalendarDays, CalendarRange, Check, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { Card, PageHeader } from '../components/ui';
import { ShiftIcon, WorkBadge } from '../components/WorkBadge';
import {
  markWorkDay,
  setNoaDay,
  updateSettings,
  useHabitLogsBetween,
  useHabits,
  useReminders,
  useRemindersBetween,
  useSettings,
  useTasks,
  useTasksBetween,
  useWorkoutsBetween,
  useWorkoutsOn,
} from '../db/queries';
import { isWorkoutDone } from '../db/schema';
import type { ISODate, Weekday } from '../db/schema';
import { formatLong, fromISO, rangeISO, shiftISO, toISO, todayISO } from '../lib/dates';
import { KIND_COLORS } from '../lib/kinds';
import { useSelectedDate } from '../lib/selectedDate';
import { isScheduled } from '../lib/streaks';
import { isNoaDay, isWeeklyWorkDay, isWorkDay, shiftOf } from '../lib/workdays';

const DOT = {
  tasks: KIND_COLORS.task,
  habits: KIND_COLORS.habit,
  workouts: KIND_COLORS.workout,
  reminders: KIND_COLORS.reminder,
};

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

interface DaySummary {
  tasksTotal: number;
  tasksDone: number;
  habitsTotal: number;
  habitsDone: number;
  workoutsTotal: number;
  workoutsDone: number;
  reminders: number;
}

export function CalendarPage() {
  const [selected, setSelected] = useSelectedDate();
  const [month, setMonth] = useState(() => startOfMonth(fromISO(selected)));
  const [openDay, setOpenDay] = useState<ISODate | null>(null);
  const [marking, setMarking] = useState(false);
  // What a tap on a date does while marking.
  const [brush, setBrush] = useState<'morning' | 'evening' | 'noa'>('morning');
  const settings = useSettings();
  const today = todayISO();

  const first = toISO(month);
  const last = toISO(endOfMonth(month));
  // Grid starts on the Sunday on/before the 1st and covers whole weeks.
  const gridStart = shiftISO(first, -month.getDay());
  const weeks = Math.ceil((month.getDay() + endOfMonth(month).getDate()) / 7);
  const cells = rangeISO(gridStart, weeks * 7);

  const tasks = useTasksBetween(first, last);
  const logs = useHabitLogsBetween(first, last);
  const workouts = useWorkoutsBetween(first, last);
  const reminders = useRemindersBetween(first, last);
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
        reminders: reminders.filter((r) => r.date === d).length,
      });
    }
    return m;
  }, [first, month, tasks, logs, habits, workouts, reminders]);

  const toggleWeekday = (d: Weekday) => {
    const days = settings.workDays.includes(d) ? settings.workDays.filter((x) => x !== d) : [...settings.workDays, d].sort();
    updateSettings({ workDays: days });
  };

  return (
    // Fills the screen: the month card takes whatever height is left, and the weeks share it.
    <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col lg:min-h-[calc(100dvh-5rem)]">
      <PageHeader title="לוח שנה" accent="blue" icon={<CalendarDays />} />

      <Card className="mb-3 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMarking((m) => !m)}
            aria-pressed={marking}
            className={`btn px-5 ${marking ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-canvas text-ink hover:bg-line/60'}`}
          >
            {marking ? <Check size={18} /> : <Briefcase size={18} />}
            {marking ? 'סיום סימון' : 'סימון ימים'}
          </button>
          {marking && (
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="מה לסמן">
              {(
                [
                  ['morning', 'עבודה בוקר'],
                  ['evening', 'עבודה ערב'],
                  ['noa', 'אצל נועה'],
                ] as const
              ).map(([b, label]) => (
                <button
                  key={b}
                  role="radio"
                  aria-checked={brush === b}
                  onClick={() => setBrush(b)}
                  className={`chip ${brush === b ? (b === 'noa' ? 'border-transparent bg-pink-500 text-white' : 'border-transparent bg-amber-500 text-white') : 'text-muted hover:text-ink'}`}
                >
                  {b === 'noa' ? <Heart size={15} /> : <ShiftIcon shift={b} size={15} />} {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <details className="group mt-3">
          <summary className="cursor-pointer text-sm font-medium text-muted marker:content-none hover:text-ink">
            ימים קבועים בשבוע ▾
          </summary>
          <div className="mt-2 flex gap-1.5" role="group" aria-label="ימי עבודה קבועים בשבוע">
            {WEEKDAYS.map((label, i) => {
              const on = settings.workDays.includes(i as Weekday);
              return (
                <button
                  key={label}
                  onClick={() => toggleWeekday(i as Weekday)}
                  aria-pressed={on}
                  aria-label={`יום ${label} ${on ? 'הוא יום עבודה קבוע' : 'אינו יום עבודה קבוע'}`}
                  className={`h-11 w-11 rounded-xl font-bold transition active:scale-95 ${
                    on ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-canvas text-muted'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </details>
      </Card>

      <Card className="flex flex-1 flex-col p-2 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <button
            aria-label="חודש קודם"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="grid h-12 w-12 place-items-center rounded-xl text-muted hover:bg-line/60 hover:text-ink"
          >
            <ChevronRight size={26} />
          </button>
          <h2 className="text-3xl font-extrabold">{format(month, 'LLLL yyyy', { locale: he })}</h2>
          <button
            aria-label="חודש הבא"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="grid h-12 w-12 place-items-center rounded-xl text-muted hover:bg-line/60 hover:text-ink"
          >
            <ChevronLeft size={26} />
          </button>
        </div>

        <div
          className="grid flex-1 grid-cols-7 gap-1 text-center sm:gap-2"
          style={{ gridTemplateRows: `auto repeat(${weeks}, minmax(64px, 1fr))` }}
        >
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-base font-bold text-muted">
              {d}
            </div>
          ))}
          {cells.map((d) => {
            const inMonth = d >= first && d <= last;
            const s = summaries.get(d);
            const isSel = d === selected;
            const isToday = d === today;
            const work = isWorkDay(d, settings);
            const shift = shiftOf(d, settings);
            const noa = isNoaDay(d, settings);
            return (
              <button
                key={d}
                onClick={() => {
                  if (marking) {
                    // Marking mode: one tap puts the chosen mark on this exact date, and a second tap takes it off.
                    if (brush === 'noa') setNoaDay(d, !noa);
                    else if (work && shift === brush) markWorkDay(d, false, isWeeklyWorkDay(d, settings));
                    else markWorkDay(d, true, isWeeklyWorkDay(d, settings), brush);
                    return;
                  }
                  setSelected(d);
                  setOpenDay(d);
                }}
                aria-pressed={marking ? (brush === 'noa' ? noa : work && shift === brush) : undefined}
                disabled={!inMonth}
                aria-label={inMonth ? `${formatLong(d)}${work ? ', יום עבודה' : ''}${shift ? (shift === 'morning' ? ' בוקר' : ' ערב') : ''}${noa ? ', אצל נועה' : ''}` : undefined}
                className={`relative flex min-h-[64px] flex-col items-stretch rounded-2xl transition active:scale-95 ${
                  !inMonth
                    ? 'invisible'
                    : marking
                      ? `${work ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : noa ? 'bg-pink-50 dark:bg-pink-500/10' : 'bg-canvas'} ${noa ? 'ring-2 ring-pink-400' : work ? '' : 'ring-1 ring-line'} ${isToday ? 'ring-[3px] ring-blue-600' : ''}`
                      : isToday
                      ? 'bg-blue-50 text-blue-700 ring-[3px] ring-blue-600 dark:bg-blue-500/15 dark:text-blue-200'
                      : isSel
                        ? 'bg-blue-50 ring-2 ring-blue-400 dark:bg-blue-500/10'
                        : work
                          ? 'bg-slate-200/70 dark:bg-slate-500/15'
                          : noa
                            ? 'bg-pink-50 dark:bg-pink-500/10'
                            : 'bg-canvas'
                }`}
              >
                {/* Three rows that never overlap: marks (work / Noa), the date, the dots. */}
                <span className="flex h-5 items-center justify-between px-1.5 pt-1" aria-hidden>
                  <span className={marking ? '' : 'text-slate-500 dark:text-slate-300'}>
                    {inMonth && work && (shift ? <ShiftIcon shift={shift} size={14} /> : <Briefcase size={14} />)}
                  </span>
                  {inMonth && noa && <Heart size={14} className="fill-pink-400 text-pink-500" />}
                </span>
                <span
                  className={`grid flex-1 place-items-center text-2xl font-bold leading-none tabular-nums sm:text-4xl ${
                    marking && work ? '' : d > today && !isToday ? 'text-muted' : ''
                  }`}
                >
                  {fromISO(d).getDate()}
                </span>
                <span className="flex h-5 items-center justify-center gap-[3px] px-0.5 pb-1 sm:gap-1.5">{s && <Dots s={s} />}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-line pt-2.5 text-xs text-muted sm:text-sm">
          <Legend color={DOT.tasks} label="משימות" />
          <Legend color={DOT.habits} label="קבועות" />
          <Legend color={DOT.workouts} label="אימונים" />
          <Legend color={DOT.reminders} label="תזכורות" />
          <span className="flex items-center gap-1.5">
            <Briefcase size={14} /> עבודה
          </span>
          <span className="flex items-center gap-1.5">
            <ShiftIcon shift="morning" /> בוקר
          </span>
          <span className="flex items-center gap-1.5">
            <ShiftIcon shift="evening" /> ערב
          </span>
          <span className="flex items-center gap-1.5">
            <Heart size={14} className="fill-pink-400 text-pink-500" /> אצל נועה
          </span>
        </div>
      </Card>

      <DaySheet date={openDay} onClose={() => setOpenDay(null)} />
    </div>
  );
}

/** Filled dot = completed, hollow ring = there was something but not completed. */
function Dots({ s }: { s: DaySummary }) {
  const dots: { color: string; filled: boolean }[] = [];
  if (s.tasksTotal) dots.push({ color: DOT.tasks, filled: s.tasksDone === s.tasksTotal });
  if (s.habitsDone) dots.push({ color: DOT.habits, filled: s.habitsDone === s.habitsTotal });
  if (s.workoutsTotal) dots.push({ color: DOT.workouts, filled: s.workoutsDone === s.workoutsTotal });
  if (s.reminders) dots.push({ color: DOT.reminders, filled: true });
  return (
    <>
      {dots.map((d, i) => (
        <span
          key={i}
          className="h-2 w-2 shrink-0 rounded-full sm:h-3.5 sm:w-3.5"
          style={{ background: d.filled ? d.color : 'transparent', border: `1.5px solid ${d.color}` }}
        />
      ))}
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

/** Everything on one day, in a pop-up. */
function DaySheet({ date, onClose }: { date: ISODate | null; onClose: () => void }) {
  const navigate = useNavigate();
  const day = date ?? todayISO();
  const tasks = useTasks(day);
  const habits = useHabits();
  const logs = useHabitLogsBetween(day, day);
  const workouts = useWorkoutsOn(day);
  const reminders = useReminders(day);
  const today = todayISO();

  const doneIds = new Set(logs.map((l) => l.habitId));
  const dayHabits = habits.filter((h) => doneIds.has(h.id!) || (isScheduled(h, day) && h.createdAt <= day));
  const byTime = <T extends { time?: string }>(a: T, b: T) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99');
  const empty = !tasks.length && !dayHabits.length && !workouts.length && !reminders.length;

  return (
    <BottomSheet open={date !== null} onClose={onClose} title={formatLong(day)}>
      <div className="space-y-5">
        <WorkBadge date={day} interactive className="justify-start" />

        {empty && <p className="py-2 text-center text-muted">אין כלום מתוכנן ביום הזה</p>}

        {tasks.length > 0 && (
          <Group title="משימות" color={DOT.tasks}>
            {[...tasks].sort(byTime).map((t) => (
              <Row key={t.id} color={DOT.tasks} mark={t.done ? 'done' : 'open'} time={t.time} text={t.title} struck={t.done} />
            ))}
          </Group>
        )}
        {dayHabits.length > 0 && (
          <Group title="משימות קבועות" color={DOT.habits}>
            {[...dayHabits].sort(byTime).map((h) => (
              <Row key={h.id} color={DOT.habits} mark={doneIds.has(h.id!) ? 'done' : 'open'} time={h.time} text={`${h.emoji} ${h.name}`} />
            ))}
          </Group>
        )}
        {workouts.length > 0 && (
          <Group title="אימונים" color={DOT.workouts}>
            {[...workouts].sort(byTime).map((w) => {
              const done = isWorkoutDone(w);
              const missed = !done && w.date < today;
              return <Row key={w.id} color={DOT.workouts} mark={done ? 'done' : missed ? 'missed' : 'open'} time={w.time} text={w.title || 'אימון'} />;
            })}
          </Group>
        )}
        {reminders.length > 0 && (
          <Group title="תזכורות" color={DOT.reminders}>
            {[...reminders].sort(byTime).map((r) => (
              <Row key={r.id} color={DOT.reminders} mark="note" time={r.time} text={r.text} />
            ))}
          </Group>
        )}

        <button
          onClick={() => {
            onClose();
            navigate('/plan');
          }}
          className="btn w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          <CalendarRange size={18} /> לתכנון היום
        </button>
      </div>
    </BottomSheet>
  );
}

function Group({ title, color, children }: { title: string; color: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {title}
      </h3>
      <ul className="space-y-1.5">{children}</ul>
    </section>
  );
}

function Row({
  color,
  mark,
  time,
  text,
  struck,
}: {
  color: string;
  mark: 'done' | 'open' | 'missed' | 'note';
  time?: string;
  text: string;
  struck?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-canvas px-3 py-2.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center">
        {mark === 'done' && (
          <span className="grid h-6 w-6 place-items-center rounded-full text-white" style={{ background: color }}>
            <Check size={14} strokeWidth={3} />
          </span>
        )}
        {mark === 'open' && <span className="h-6 w-6 rounded-full border-2" style={{ borderColor: color }} />}
        {mark === 'missed' && <span className="text-lg">❌</span>}
        {mark === 'note' && <Bell size={18} style={{ color }} />}
      </span>
      {time && (
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {time}
        </span>
      )}
      <span className={`flex-1 font-medium ${struck ? 'text-muted line-through' : ''}`}>{text}</span>
      {mark === 'missed' && <span className="text-xs font-semibold text-red-500">התפספס</span>}
    </li>
  );
}
