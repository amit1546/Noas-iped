import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftCircle, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { addSomeday, deleteSomeday, scheduleSomeday, toggleSomeday, useSomeday } from '../db/queries';
import type { ISODate } from '../db/schema';
import { formatShort, todayISO } from '../lib/dates';
import { KIND_COLORS } from '../lib/kinds';
import { CheckCircle, IconButton } from './ui';

/** A list of things to do with no day: any item can be given the day currently open in the plan. */
export function SomedayList({ date }: { date: ISODate }) {
  const items = useSomeday();
  const [text, setText] = useState('');
  // Open ones first, in the order they were added
  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done) || (a.id ?? 0) - (b.id ?? 0));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    await addSomeday(t, todayISO());
    setText('');
  };

  return (
    <div>
      <form onSubmit={submit} className="mb-3 flex gap-2">
        <input className="input flex-1" placeholder="להוסיף לרשימה…" aria-label="פריט חדש ברשימה הכללית" value={text} onChange={(e) => setText(e.target.value)} />
        <button
          type="submit"
          aria-label="הוסף לרשימה הכללית"
          disabled={!text.trim()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white transition active:scale-95 disabled:opacity-40"
          style={{ background: KIND_COLORS.task }}
        >
          <Plus size={22} />
        </button>
      </form>
      {sorted.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted">הרשימה ריקה</p>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {sorted.map((t) => (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 rounded-2xl bg-canvas pe-1 ps-3"
              >
                <button onClick={() => toggleSomeday(t)} className="flex min-h-[52px] flex-1 items-center gap-3 text-start">
                  <CheckCircle checked={t.done} color={KIND_COLORS.task} />
                  <span className={`flex-1 font-medium ${t.done ? 'text-muted line-through' : ''}`}>{t.title}</span>
                </button>
                {!t.done && (
                  <IconButton label={`העבר את "${t.title}" ל־${formatShort(date)}`} onClick={() => scheduleSomeday(t, date)}>
                    <ArrowLeftCircle size={18} />
                  </IconButton>
                )}
                <IconButton label={`מחק את "${t.title}" מהרשימה`} onClick={() => deleteSomeday(t.id!)}>
                  <Trash2 size={18} />
                </IconButton>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
