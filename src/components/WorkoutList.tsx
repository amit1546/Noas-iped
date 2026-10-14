import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { addWorkout, deleteWorkout, setWorkoutDone, useWorkoutNames, useWorkoutsOn } from '../db/queries';
import { isWorkoutDone, type ISODate } from '../db/schema';
import { formatShort } from '../lib/dates';
import { BottomSheet } from './BottomSheet';
import { useCelebrate } from './Confetti';
import { Button, CheckCircle, IconButton } from './ui';

const COLOR = '#2563eb';

export function WorkoutList({ date, adding, onCloseAdd }: { date: ISODate; adding: boolean; onCloseAdd: () => void }) {
  const workouts = useWorkoutsOn(date);
  const celebrate = useCelebrate();
  const sorted = [...workouts].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));

  const toggle = async (id: number, done: boolean) => {
    await setWorkoutDone(id, !done);
    if (!done) celebrate('אימון הושלם — כל הכבוד! 💪');
  };

  return (
    <>
      {sorted.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted">אין אימונים מתוכננים ליום הזה</p>
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
                  className="flex items-center gap-2 rounded-2xl border-2 pe-1 ps-3 transition"
                  style={{ borderColor: done ? COLOR : 'transparent', background: done ? `${COLOR}12` : 'rgb(var(--canvas))' }}
                >
                  <button onClick={() => toggle(w.id!, done)} className="flex min-h-[56px] flex-1 items-center gap-3 text-start">
                    <CheckCircle checked={done} color={COLOR} />
                    <span className="flex-1">
                      <span className="block font-semibold leading-tight">{w.title || 'אימון'}</span>
                      <span className="text-xs text-muted">{w.time ? `בשעה ${w.time}` : 'ללא שעה'}</span>
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
      <AddWorkoutSheet open={adding} onClose={onCloseAdd} defaultDate={date} />
    </>
  );
}

function AddWorkoutSheet({ open, onClose, defaultDate }: { open: boolean; onClose: () => void; defaultDate: ISODate }) {
  const names = useWorkoutNames();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setDate(defaultDate);
      setTime('');
    }
  }, [open, defaultDate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addWorkout({ title: title.trim(), date, time: time || undefined });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="אימון חדש">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="workout-name">
            שם האימון
          </label>
          <input
            id="workout-name"
            className="input"
            placeholder="לדוגמה: ריצה, חדר כושר, יוגה"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {names.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {names.slice(0, 8).map((n) => (
                <button type="button" key={n} onClick={() => setTitle(n)} className="chip text-muted hover:text-ink">
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="workout-date">
              יום
            </label>
            <input
              id="workout-date"
              className="input"
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="workout-time">
              שעה <span className="font-normal">(לא חובה)</span>
            </label>
            <input id="workout-time" className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={!title.trim()}>
          {date === defaultDate ? 'הוספת אימון' : `הוספת אימון ל-${formatShort(date)}`}
        </Button>
      </form>
    </BottomSheet>
  );
}
