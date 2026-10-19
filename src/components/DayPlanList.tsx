import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftCircle, Bell, Dumbbell, Flag, ListChecks, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  addReminder,
  addTask,
  addWorkout,
  deleteReminder,
  deleteTask,
  deleteWorkout,
  moveTask,
  setWorkoutDone,
  toggleTask,
  useReminders,
  useTasks,
  useWorkoutsOn,
} from '../db/queries';
import { isWorkoutDone, type ISODate, type Priority, type Reminder, type Task, type Workout } from '../db/schema';
import { shiftISO, todayISO } from '../lib/dates';
import { KIND_COLORS } from '../lib/kinds';
import { useCelebrate } from './Confetti';
import { ItemCalendarButton } from './ItemCalendarButton';
import { OptionalTime } from './OptionalTime';
import { CheckCircle, IconButton } from './ui';

type Kind = 'task' | 'workout' | 'reminder';

const KINDS: { kind: Kind; label: string; placeholder: string; icon: typeof ListChecks }[] = [
  { kind: 'task', label: 'משימה', placeholder: 'משימה חדשה…', icon: ListChecks },
  { kind: 'workout', label: 'אימון', placeholder: 'אימון חדש…', icon: Dumbbell },
  { kind: 'reminder', label: 'תזכורת', placeholder: 'תזכורת חדשה…', icon: Bell },
];

const PRIORITY_COLOR: Record<Priority, string> = { high: '#ef4444', medium: '#f59e0b', low: '#94a3b8' };
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABEL: Record<Priority, string> = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };
const NEXT_PRIORITY: Record<Priority, Priority> = { low: 'medium', medium: 'high', high: 'low' };

type Item =
  | { kind: 'task'; time?: string; done: boolean; task: Task }
  | { kind: 'workout'; time?: string; done: boolean; workout: Workout }
  | { kind: 'reminder'; time?: string; done: false; reminder: Reminder };

/**
 * Tasks, workouts and reminders for one day in a single list, sorted by time.
 * Each kind still lives in its own table — this only merges how they're shown and added.
 */
export function DayPlanList({ date }: { date: ISODate }) {
  const tasks = useTasks(date);
  const workouts = useWorkoutsOn(date);
  const reminders = useReminders(date);
  const celebrate = useCelebrate();

  const [kind, setKind] = useState<Kind>('task');
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const items: Item[] = [
    ...tasks.map((t): Item => ({ kind: 'task', time: t.time, done: t.done, task: t })),
    ...workouts.map((w): Item => ({ kind: 'workout', time: w.time, done: isWorkoutDone(w), workout: w })),
    ...reminders.map((r): Item => ({ kind: 'reminder', time: r.time, done: false, reminder: r })),
  ].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      (a.time ?? '99:99').localeCompare(b.time ?? '99:99') ||
      (a.kind === 'task' && b.kind === 'task' ? PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority] : 0),
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const at = time || undefined;
    if (kind === 'task') await addTask({ title: t, date, done: false, priority, time: at });
    else if (kind === 'workout') await addWorkout({ title: t, date, time: at });
    else await addReminder({ date, text: t, time: at });
    setText('');
    setTime('');
  };

  const toggleWorkout = async (w: Workout) => {
    const done = isWorkoutDone(w);
    await setWorkoutDone(w.id!, !done);
    if (!done) celebrate('אימון הושלם — כל הכבוד! 💪');
  };

  const current = KINDS.find((k) => k.kind === kind)!;
  const isPast = date < todayISO();

  return (
    <div>
      <form onSubmit={submit} className="mb-3 space-y-2">
        <div className="flex gap-1.5" role="radiogroup" aria-label="סוג">
          {KINDS.map(({ kind: k, label, icon: Icon }) => {
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
        />
        <div className="flex items-center gap-2">
          <OptionalTime value={time} onChange={setTime} label={`שעה ל${current.label}`} />
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

      {items.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted">אין עדיין כלום ליום הזה ✨</p>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={`${item.kind}-${item.kind === 'task' ? item.task.id : item.kind === 'workout' ? item.workout.id : item.reminder.id}`}
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
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
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
