import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftCircle, Bell, Dumbbell, Flag, ListChecks, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  addReminder,
  addTask,
  addWorkout,
  deleteHabit,
  deleteReminder,
  deleteTask,
  deleteWorkout,
  moveTask,
  setWorkoutDone,
  toggleHabit,
  toggleTask,
  useAllHabitLogs,
  useHabits,
  useReminders,
  useTasks,
  useWorkoutsOn,
} from '../db/queries';
import { isWorkoutDone, type Habit, type ISODate, type Priority, type Reminder, type Task, type Workout } from '../db/schema';
import { describeDays } from '../lib/habitText';
import { isScheduled } from '../lib/streaks';
import { BottomSheet } from './BottomSheet';
import { shiftISO, todayISO } from '../lib/dates';
import { KIND_COLORS } from '../lib/kinds';
import { useCelebrate } from './Confetti';
import { ItemCalendarButton } from './ItemCalendarButton';
import { OptionalTime } from './OptionalTime';
import { CheckCircle, IconButton } from './ui';

type Kind = 'task' | 'workout' | 'reminder' | 'habit';

const KINDS: { kind: Kind; label: string; placeholder: string; icon: typeof ListChecks }[] = [
  { kind: 'task', label: 'משימה', placeholder: 'משימה חדשה…', icon: ListChecks },
  { kind: 'workout', label: 'אימון', placeholder: 'אימון חדש…', icon: Dumbbell },
  { kind: 'reminder', label: 'תזכורת', placeholder: 'תזכורת חדשה…', icon: Bell },
  { kind: 'habit', label: 'קבועה', placeholder: 'משימה קבועה…', icon: Repeat },
];

const PRIORITY_COLOR: Record<Priority, string> = { high: '#ef4444', medium: '#f59e0b', low: '#94a3b8' };
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABEL: Record<Priority, string> = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };
const NEXT_PRIORITY: Record<Priority, Priority> = { low: 'medium', medium: 'high', high: 'low' };

type Item =
  | { kind: 'task'; time?: string; done: boolean; task: Task }
  | { kind: 'workout'; time?: string; done: boolean; workout: Workout }
  | { kind: 'reminder'; time?: string; done: false; reminder: Reminder }
  | { kind: 'habit'; time?: string; done: boolean; habit: Habit };

/**
 * Tasks, workouts and reminders for one day in a single list, sorted by time.
 * Each kind still lives in its own table — this only merges how they're shown and added.
 */
export function DayPlanList({
  date,
  onEditHabit,
  onAddHabit,
}: {
  date: ISODate;
  /** Opens the form for a recurring task (days, time, icon). Without it, recurring tasks can't be added or edited here. */
  onEditHabit?: (h: Habit) => void;
  onAddHabit?: (name: string) => void;
}) {
  const habits = useHabits();
  const habitLogs = useAllHabitLogs();
  const [managing, setManaging] = useState(false);
  const tasks = useTasks(date);
  const workouts = useWorkoutsOn(date);
  const reminders = useReminders(date);
  const celebrate = useCelebrate();

  const items: Item[] = [
    ...tasks.map((t): Item => ({ kind: 'task', time: t.time, done: t.done, task: t })),
    ...workouts.map((w): Item => ({ kind: 'workout', time: w.time, done: isWorkoutDone(w), workout: w })),
    ...reminders.map((r): Item => ({ kind: 'reminder', time: r.time, done: false, reminder: r })),
    // Recurring tasks that fall on this day (or were ticked on it anyway)
    ...habits
      .filter((h) => habitLogs.some((l) => l.habitId === h.id && l.date === date) || (isScheduled(h, date) && h.createdAt <= date))
      .map((h): Item => ({ kind: 'habit', time: h.time, done: habitLogs.some((l) => l.habitId === h.id && l.date === date), habit: h })),
  ].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      (a.time ?? '99:99').localeCompare(b.time ?? '99:99') ||
      (a.kind === 'task' && b.kind === 'task' ? PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority] : 0),
  );

  const toggleWorkout = async (w: Workout) => {
    const done = isWorkoutDone(w);
    await setWorkoutDone(w.id!, !done);
    if (!done) celebrate('אימון הושלם — כל הכבוד! 💪');
  };

  const isPast = date < todayISO();

  return (
    <div>
      <PlanAddForm date={date} onRecurring={onAddHabit} />

      {items.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted">אין עדיין כלום ליום הזה ✨</p>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={`${item.kind}-${item.kind === 'task' ? item.task.id : item.kind === 'workout' ? item.workout.id : item.kind === 'habit' ? item.habit.id : item.reminder.id}`}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 rounded-2xl bg-canvas pe-1 ps-3"
                style={{ borderInlineStart: `3px solid ${KIND_COLORS[item.kind]}` }}
              >
                {item.kind === 'task' && <TaskRow task={item.task} isPast={isPast} />}
                {item.kind === 'workout' && <WorkoutRow workout={item.workout} onToggle={toggleWorkout} />}
                {item.kind === 'reminder' && <ReminderRow reminder={item.reminder} />}
                {item.kind === 'habit' && <HabitRow habit={item.habit} date={date} done={item.done} onEdit={onEditHabit} />}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {onEditHabit && habits.length > 0 && (
        <button className="mt-3 text-sm font-medium text-muted underline" onClick={() => setManaging(true)}>
          כל המשימות הקבועות ({habits.length})
        </button>
      )}
      {onEditHabit && (
        <BottomSheet open={managing} onClose={() => setManaging(false)} title="משימות קבועות">
          <ul className="space-y-2">
            {habits.map((h) => (
              <li key={h.id} className="flex items-center gap-2 rounded-2xl bg-canvas py-2 pe-1 ps-3">
                <span className="text-2xl">{h.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{h.name}</span>
                  <span className="text-xs text-muted">{[describeDays(h), h.time].filter(Boolean).join(' · ')}</span>
                </span>
                <IconButton
                  label={`עריכת ${h.name}`}
                  onClick={() => {
                    setManaging(false);
                    onEditHabit(h);
                  }}
                >
                  <Pencil size={18} />
                </IconButton>
                <IconButton label={`מחיקת ${h.name}`} onClick={() => confirm(`למחוק את "${h.name}" ואת כל ההיסטוריה שלה?`) && deleteHabit(h.id!)}>
                  <Trash2 size={18} />
                </IconButton>
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}
    </div>
  );
}

/** One add form for tasks, workouts and reminders on a given day. */
export function PlanAddForm({
  date,
  onAdded,
  autoFocus = false,
  onRecurring,
}: {
  date: ISODate;
  onAdded?: () => void;
  autoFocus?: boolean;
  /** When given, a "recurring" choice is offered; it hands the typed name over to open the recurring-task form. */
  onRecurring?: (name: string) => void;
}) {
  const [kind, setKind] = useState<Kind>('task');
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const at = time || undefined;
    if (kind === 'habit') onRecurring?.(t);
    else if (kind === 'task') await addTask({ title: t, date, done: false, priority, time: at });
    else if (kind === 'workout') await addWorkout({ title: t, date, time: at });
    else await addReminder({ date, text: t, time: at });
    setText('');
    setTime('');
    onAdded?.();
  };

  const kinds = onRecurring ? KINDS : KINDS.filter((k) => k.kind !== 'habit');
  const current = KINDS.find((k) => k.kind === kind)!;

  return (
      <form onSubmit={submit} className={onAdded ? 'space-y-3' : 'mb-3 space-y-2'}>
        <div className="flex gap-1.5" role="radiogroup" aria-label="סוג">
          {kinds.map(({ kind: k, label, icon: Icon }) => {
            const active = k === kind;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setKind(k)}
                className={`chip flex-1 justify-center ${active ? 'border-transparent text-white' : 'text-muted hover:text-ink'}`}
                style={active ? { background: KIND_COLORS[k] } : undefined}
              >
                <Icon size={15} /> {label}
              </button>
            );
          })}
        </div>
        <input
          className="input"
          placeholder={current.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={current.placeholder}
          autoFocus={autoFocus}
        />
        <div className="flex items-center gap-2">
          {kind !== 'habit' && <OptionalTime value={time} onChange={setTime} label={`שעה ל${current.label}`} />}
          <span className="flex-1" />
          {kind === 'task' && (
            <button
              type="button"
              onClick={() => setPriority(NEXT_PRIORITY[priority])}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line"
              title={`עדיפות: ${PRIORITY_LABEL[priority]}`}
              aria-label={`עדיפות: ${PRIORITY_LABEL[priority]}`}
            >
              <Flag size={20} color={PRIORITY_COLOR[priority]} fill={PRIORITY_COLOR[priority]} />
            </button>
          )}
          <button
            type="submit"
            aria-label={`הוסף ${current.label}`}
            disabled={!text.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white transition active:scale-95 disabled:opacity-40"
            style={{ background: KIND_COLORS[kind] }}
          >
            <Plus size={22} />
          </button>
        </div>
      </form>
  );
}

function Time({ time, color }: { time?: string; color: string }) {
  if (!time) return null;
  return (
    <span className="me-2 text-sm font-semibold tabular-nums" style={{ color }}>
      {time}
    </span>
  );
}

function TaskRow({ task, isPast }: { task: Task; isPast: boolean }) {
  return (
    <>
      <button onClick={() => toggleTask(task)} className="flex min-h-[52px] flex-1 items-center gap-3 text-start">
        <CheckCircle checked={task.done} color={KIND_COLORS.task} />
        <span className={`flex-1 font-medium transition ${task.done ? 'text-muted line-through' : ''}`}>
          <Time time={task.time} color={KIND_COLORS.task} />
          {task.title}
        </span>
        <span className="h-2 w-2 rounded-full" style={{ background: PRIORITY_COLOR[task.priority] }} />
      </button>
      {!task.done && (
        <IconButton
          label={isPast ? 'העבר להיום' : 'דחה למחר'}
          onClick={() => moveTask(task.id!, isPast ? todayISO() : shiftISO(task.date, 1))}
        >
          <ArrowLeftCircle size={18} />
        </IconButton>
      )}
      {!task.done && (
        <ItemCalendarButton item={{ uid: `task-${task.id}`, kind: 'task', title: task.title, date: task.date, time: task.time }} />
      )}
      <IconButton label="מחק משימה" onClick={() => deleteTask(task.id!)}>
        <Trash2 size={18} />
      </IconButton>
    </>
  );
}

function HabitRow({ habit: h, date, done, onEdit }: { habit: Habit; date: ISODate; done: boolean; onEdit?: (h: Habit) => void }) {
  const color = KIND_COLORS.habit;
  return (
    <>
      <button onClick={() => toggleHabit(h.id!, date)} className="flex min-h-[52px] flex-1 items-center gap-3 text-start">
        <CheckCircle checked={done} color={color} />
        <span className={`flex-1 font-medium transition ${done ? 'text-muted line-through' : ''}`}>
          <Time time={h.time} color={color} />
          {h.emoji} {h.name}
        </span>
        <Repeat size={15} className="shrink-0" style={{ color }} />
      </button>
      {h.time && (
        <ItemCalendarButton
          item={{ uid: `habit-${h.id}`, kind: 'habit', title: `${h.emoji} ${h.name}`, date, time: h.time, repeat: h.days.length ? h.days : 'daily' }}
        />
      )}
      {onEdit && (
        <IconButton label={`עריכת ${h.name}`} onClick={() => onEdit(h)}>
          <Pencil size={18} />
        </IconButton>
      )}
    </>
  );
}

function WorkoutRow({ workout: w, onToggle }: { workout: Workout; onToggle: (w: Workout) => void }) {
  const done = isWorkoutDone(w);
  const missed = !done && w.date < todayISO();
  return (
    <>
      <button onClick={() => onToggle(w)} className="flex min-h-[52px] flex-1 items-center gap-3 text-start">
        {missed ? (
          <span className="grid h-7 w-7 shrink-0 place-items-center text-xl" title="התפספס">
            ❌
          </span>
        ) : (
          <CheckCircle checked={done} color={KIND_COLORS.workout} />
        )}
        <span className={`flex-1 font-medium ${done ? 'text-muted line-through' : ''}`}>
          <Time time={w.time} color={KIND_COLORS.workout} />
          {w.title || 'אימון'}
          {missed && <span className="ms-2 text-xs font-semibold text-red-500">התפספס</span>}
        </span>
        <Dumbbell size={16} className="shrink-0" style={{ color: KIND_COLORS.workout }} />
      </button>
      {!done && (
        <ItemCalendarButton item={{ uid: `workout-${w.id}`, kind: 'workout', title: w.title || 'אימון', date: w.date, time: w.time }} />
      )}
      <IconButton label="מחק אימון" onClick={() => deleteWorkout(w.id!)}>
        <Trash2 size={18} />
      </IconButton>
    </>
  );
}

function ReminderRow({ reminder: r }: { reminder: Reminder }) {
  return (
    <>
      <div className="flex min-h-[52px] flex-1 items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center">
          <Bell size={18} style={{ color: KIND_COLORS.reminder }} />
        </span>
        <span className="min-w-0 flex-1 font-medium">
          <Time time={r.time} color={KIND_COLORS.reminder} />
          {r.text}
        </span>
      </div>
      <ItemCalendarButton item={{ uid: `reminder-${r.id}`, kind: 'reminder', title: r.text, date: r.date, time: r.time }} />
      <IconButton label="מחק תזכורת" onClick={() => deleteReminder(r.id!)}>
        <Trash2 size={18} />
      </IconButton>
    </>
  );
}
