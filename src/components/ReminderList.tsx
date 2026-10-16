import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { addReminder, deleteReminder, useReminders } from '../db/queries';
import type { ISODate } from '../db/schema';
import { KIND_COLORS } from '../lib/kinds';
import { ItemCalendarButton } from './ItemCalendarButton';
import { OptionalTime } from './OptionalTime';
import { IconButton } from './ui';

/** Reminders for one day: things to remember that aren't tasks, so there's nothing to check off. */
export function ReminderList({ date }: { date: ISODate }) {
  const reminders = useReminders(date);
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const sorted = [...reminders].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addReminder({ date, text: text.trim(), time: time || undefined });
    setText('');
    setTime('');
  };

  return (
    <div>
      <form onSubmit={submit} className="mb-3 space-y-2">
        <input
          className="input"
          placeholder="תזכורת חדשה…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="תזכורת חדשה"
        />
        <div className="flex items-center gap-2">
          <OptionalTime value={time} onChange={setTime} label="שעה לתזכורת" />
          <span className="flex-1" />
          <button
            type="submit"
            aria-label="הוסף תזכורת"
            disabled={!text.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white transition active:scale-95 disabled:opacity-40"
            style={{ background: KIND_COLORS.reminder }}
          >
            <Plus size={22} />
          </button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted">אין תזכורות ליום הזה</p>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {sorted.map((r) => (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 rounded-2xl bg-canvas py-1.5 pe-1 ps-3"
              >
                <Bell size={18} className="shrink-0" style={{ color: KIND_COLORS.reminder }} />
                <span className="min-w-0 flex-1 font-medium">
                  {r.time && (
                    <span className="me-2 text-sm font-semibold tabular-nums" style={{ color: KIND_COLORS.reminder }}>
                      {r.time}
                    </span>
                  )}
                  {r.text}
                </span>
                <ItemCalendarButton item={{ uid: `reminder-${r.id}`, kind: 'reminder', title: r.text, date: r.date, time: r.time }} />
                <IconButton label="מחק תזכורת" onClick={() => deleteReminder(r.id!)}>
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
