import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { addWorkout, deleteWorkout, setWorkoutDone, useWorkoutNames, useWorkoutsOn } from '../db/queries';
import { isWorkoutDone, type ISODate } from '../db/schema';
import { useCelebrate } from './Confetti';
import { OptionalTime } from './OptionalTime';
import { CheckCircle, IconButton } from './ui';

const COLOR = '#2563eb';

/** Workouts for a day with a one-line add (name + optional time). */
export function WorkoutList({ date }: { date: ISODate }) {
  const workouts = useWorkoutsOn(date);
  const names = useWorkoutNames();
  const celebrate = useCelebrate();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const sorted = [...workouts].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
  const suggestions = names.filter((n) => n !== title).slice(0, 6);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addWorkout({ title: title.trim(), date, time: time || undefined });
    setTitle('');
    setTime('');
  };

  const toggle = async (id: number, done: boolean) => {
    await setWorkoutDone(id, !done);
    if (!done) celebrate('אימון הושלם — כל הכבוד! 💪');
  };

  return (
    <div>
      <form onSubmit={submit} className="mb-3 space-y-2">
        <input
          className="input"
          placeholder="אימון חדש… (ריצה, חדר כושר, יוגה)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="אימון חדש"
        />
        {suggestions.length > 0 && !title && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((n) => (
              <button type="button" key={n} onClick={() => setTitle(n)} className="chip text-muted hover:text-ink">
                {n}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <OptionalTime value={time} onChange={setTime} label="שעה לאימון" />
          <span className="flex-1" />
          <button
            type="submit"
            aria-label="הוסף אימון"
            disabled={!title.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-40"
          >
            <Plus size={22} />
          </button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted">אין אימונים ליום הזה</p>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {sorted.map((w) => {
              const done = isWorkoutDone(w);
              return (
                <motion.li
                  key={w.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-2xl bg-canvas pe-1 ps-3"
                >
                  <button onClick={() => toggle(w.id!, done)} className="flex min-h-[52px] flex-1 items-center gap-3 text-start">
                    <CheckCircle checked={done} color={COLOR} />
                    <span className={`flex-1 font-medium ${done ? 'text-muted line-through' : ''}`}>
                      {w.time && <span className="me-2 text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">{w.time}</span>}
                      {w.title || 'אימון'}
                    </span>
                  </button>
                  <IconButton label="מחק אימון" onClick={() => deleteWorkout(w.id!)}>
                    <Trash2 size={18} />
                  </IconButton>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
