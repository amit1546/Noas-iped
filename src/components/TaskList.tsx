import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftCircle, Flag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { addTask, deleteTask, moveTask, toggleTask, useTasks } from '../db/queries';
import type { ISODate, Priority, Task } from '../db/schema';
import { shiftISO, todayISO } from '../lib/dates';
import { CheckCircle, EmptyState, IconButton } from './ui';

const PRIORITY_COLOR: Record<Priority, string> = { high: '#ef4444', medium: '#f59e0b', low: '#94a3b8' };
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABEL: Record<Priority, string> = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };
const NEXT_PRIORITY: Record<Priority, Priority> = { low: 'medium', medium: 'high', high: 'low' };

export function TaskList({ date, compact = false }: { date: ISODate; compact?: boolean }) {
  const tasks = useTasks(date);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const sorted = [...tasks].sort(
    (a, b) => Number(a.done) - Number(b.done) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    await addTask({ title: t, date, done: false, priority });
    setTitle('');
  };

  const canCarry = date < todayISO();

  return (
    <div>
      <form onSubmit={submit} className="mb-3 flex gap-2">
        <input
          className="input"
          placeholder="משימה חדשה…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="משימה חדשה"
        />
        <button
          type="button"
          onClick={() => setPriority(NEXT_PRIORITY[priority])}
          className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-2xl border border-line"
          title={`עדיפות: ${PRIORITY_LABEL[priority]}`}
          aria-label={`עדיפות: ${PRIORITY_LABEL[priority]}`}
        >
          <Flag size={20} color={PRIORITY_COLOR[priority]} fill={PRIORITY_COLOR[priority]} />
        </button>
        <button type="submit" className="btn shrink-0 bg-violet-600 text-white hover:bg-violet-700">
          הוסף
        </button>
      </form>

      {sorted.length === 0 ? (
        !compact && <EmptyState emoji="📝" title="אין משימות ליום הזה" text="הוסף משימה למעלה ותתחיל לסמן ✓" />
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
        <CheckCircle checked={task.done} color="#8b5cf6" />
        <span className={`flex-1 font-medium transition ${task.done ? 'text-muted line-through' : ''}`}>
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
