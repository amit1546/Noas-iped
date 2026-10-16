import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftCircle, Flag, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { addTask, deleteTask, moveTask, toggleTask, useTasks } from '../db/queries';
import type { ISODate, Priority, Task } from '../db/schema';
import { shiftISO, todayISO } from '../lib/dates';
import { ACCENT_500 } from '../lib/appearance';
import { OptionalTime } from './OptionalTime';
import { CheckCircle, IconButton } from './ui';

const PRIORITY_COLOR: Record<Priority, string> = { high: '#ef4444', medium: '#f59e0b', low: '#94a3b8' };
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABEL: Record<Priority, string> = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };
const NEXT_PRIORITY: Record<Priority, Priority> = { low: 'medium', medium: 'high', high: 'low' };

export function TaskList({ date }: { date: ISODate }) {
  const tasks = useTasks(date);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [time, setTime] = useState('');

  const sorted = [...tasks].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      (a.time ?? '99:99').localeCompare(b.time ?? '99:99') ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    await addTask({ title: t, date, done: false, priority, time: time || undefined });
    setTitle('');
    setTime('');
  };

  const canCarry = date < todayISO();

  return (
    <div>
      <form onSubmit={submit} className="mb-3 space-y-2">
        <input
          className="input"
          placeholder="משימה חדשה…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="משימה חדשה"
        />
        <div className="flex items-center gap-2">
          <OptionalTime value={time} onChange={setTime} label="שעה למשימה" />
          <span className="flex-1" />
        <button
          type="button"
          onClick={() => setPriority(NEXT_PRIORITY[priority])}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line"
          title={`עדיפות: ${PRIORITY_LABEL[priority]}`}
          aria-label={`עדיפות: ${PRIORITY_LABEL[priority]}`}
        >
          <Flag size={20} color={PRIORITY_COLOR[priority]} fill={PRIORITY_COLOR[priority]} />
        </button>
        <button
          type="submit"
          aria-label="הוסף משימה"
          disabled={!title.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-40"
        >
          <Plus size={22} />
        </button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted">אין משימות ליום הזה ✨</p>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {sorted.map((t) => (
              <TaskRow key={t.id} task={t} canCarry={canCarry} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function TaskRow({ task, canCarry }: { task: Task; canCarry: boolean }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 rounded-2xl bg-canvas pe-1 ps-3"
    >
      <button onClick={() => toggleTask(task)} className="flex min-h-[52px] flex-1 items-center gap-3 text-start">
        <CheckCircle checked={task.done} color={ACCENT_500} />
        <span className={`flex-1 font-medium transition ${task.done ? 'text-muted line-through' : ''}`}>
          {task.time && (
            <span className="me-2 text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">{task.time}</span>
          )}
          {task.title}
        </span>
        <span className="h-2 w-2 rounded-full" style={{ background: PRIORITY_COLOR[task.priority] }} />
      </button>
      {canCarry && !task.done && (
        <IconButton label="העבר להיום" onClick={() => moveTask(task.id!, todayISO())}>
          <ArrowLeftCircle size={18} />
        </IconButton>
      )}
      {!canCarry && !task.done && (
        <IconButton label="דחה למחר" onClick={() => moveTask(task.id!, shiftISO(task.date, 1))}>
          <ArrowLeftCircle size={18} />
        </IconButton>
      )}
      <IconButton label="מחק משימה" onClick={() => deleteTask(task.id!)}>
        <Trash2 size={18} />
      </IconButton>
    </motion.li>
  );
}
