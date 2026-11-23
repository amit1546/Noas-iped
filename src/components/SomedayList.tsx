import { AnimatePresence, motion } from 'framer-motion';
import { CalendarPlus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { addSomeday, deleteSomeday, scheduleSomeday, toggleSomeday, useSomeday } from '../db/queries';
import type { ISODate, SomedayTask } from '../db/schema';
import { formatLong, shiftISO, todayISO } from '../lib/dates';
import { KIND_COLORS } from '../lib/kinds';
import { BottomSheet } from './BottomSheet';
import { Button, CheckCircle, IconButton } from './ui';

/** A plain to-do list with no days or times. The calendar button on an item picks the day it should be done on. */
export function SomedayList({ date }: { date: ISODate }) {
  const items = useSomeday();
  const [picking, setPicking] = useState<SomedayTask | null>(null);
  const [day, setDay] = useState(date);
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
                  <IconButton
                    label={`בחר יום ל"${t.title}"`}
                    onClick={() => {
                      setDay(date);
                      setPicking(t);
                    }}
                  >
                    <CalendarPlus size={18} />
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
      <BottomSheet open={picking !== null} onClose={() => setPicking(null)} title="לאיזה יום?">
        {picking && (
          <div className="space-y-4">
            <p className="font-semibold">{picking.title}</p>
            <input
              type="date"
              className="input"
              value={day}
              aria-label="יום"
              onChange={(e) => e.target.value && setDay(e.target.value)}
            />
            <div className="flex gap-2">
              {[
                ['היום', todayISO()],
                ['מחר', shiftISO(todayISO(), 1)],
              ].map(([label, d]) => (
                <button key={label} type="button" onClick={() => setDay(d)} className={`chip flex-1 justify-center ${day === d ? 'border-transparent bg-blue-600 text-white' : 'text-muted'}`}>
                  {label}
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={async () => {
                await scheduleSomeday(picking, day);
                setPicking(null);
              }}
            >
              <CalendarPlus size={18} /> הוסף ל{formatLong(day)}
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
