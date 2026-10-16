import { CalendarPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  useHabits,
  useMealsBetween,
  useRemindersBetween,
  useTasksBetween,
  useWorkoutsBetween,
} from '../db/queries';
import type { ISODate } from '../db/schema';
import { candidateEvents, eventsICS, KIND_EMOJI, type EventKind } from '../lib/calendarExport';
import { formatLong, rangeISO } from '../lib/dates';
import { describeDays } from '../lib/habitText';
import { KIND_COLORS } from '../lib/kinds';
import { isStandaloneApp, sendICS } from '../lib/reminder';
import { BottomSheet } from './BottomSheet';
import { Button, Segmented } from './ui';

const KIND_LABEL: Record<EventKind, string> = { task: 'משימה', habit: 'הרגל', workout: 'אימון', meal: 'ארוחה', reminder: 'תזכורת' };

/** A button that opens the "send to the phone's calendar (and so to the watch)" sheet. */
export function CalendarExportButton({ date, label = 'ליומן הטלפון' }: { date: ISODate; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="chip text-muted hover:text-ink" onClick={() => setOpen(true)} aria-label="הוסף ליומן הטלפון">
        <CalendarPlus size={16} /> {label}
      </button>
      <CalendarExportSheet open={open} date={date} onClose={() => setOpen(false)} />
    </>
  );
}

function CalendarExportSheet({ open, date, onClose }: { open: boolean; date: ISODate; onClose: () => void }) {
  const [range, setRange] = useState<'day' | 'week'>('day');
  const [lead, setLead] = useState<0 | 10 | 30>(0);
  const [recurHabits, setRecurHabits] = useState(false);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const days = useMemo(() => (range === 'day' ? [date] : rangeISO(date, 7)), [range, date]);
  const from = days[0];
  const to = days[days.length - 1];
  const tasks = useTasksBetween(from, to);
  const workouts = useWorkoutsBetween(from, to);
  const meals = useMealsBetween(from, to);
  const reminders = useRemindersBetween(from, to);
  const habits = useHabits();

  useEffect(() => {
    if (open) setSkipped(new Set());
  }, [open, date, range]);

  const events = useMemo(
    () => candidateEvents({ days, tasks, workouts, meals, reminders, habits, recurHabits }),
    [days, tasks, workouts, meals, reminders, habits, recurHabits],
  );
  const chosen = events.filter((e) => !skipped.has(e.uid));
  const hasHabitWithTime = habits.some((h) => h.time);

  const toggle = (uid: string) =>
    setSkipped((s) => {
      const next = new Set(s);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  const send = async () => {
    await sendICS(eventsICS(chosen, lead), 'noas-journal.ics');
    onClose();
  };

  let lastDay = '';
  return (
    <BottomSheet open={open} onClose={onClose} title="הוספה ליומן הטלפון">
      <div className="space-y-4">
        <div className="space-y-3">
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: 'day', label: 'היום הזה' },
              { value: 'week', label: '7 ימים' },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted">התראה</span>
            <Segmented
              value={String(lead) as '0' | '10' | '30'}
              onChange={(v) => setLead(Number(v) as 0 | 10 | 30)}
              options={[
                { value: '0', label: 'בזמן' },
                { value: '10', label: '10 דק׳ לפני' },
                { value: '30', label: '30 דק׳ לפני' },
              ]}
            />
          </div>
          {hasHabitWithTime && (
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-canvas p-3">
              <input type="checkbox" className="h-5 w-5 accent-blue-600" checked={recurHabits} onChange={(e) => setRecurHabits(e.target.checked)} />
              <span className="font-medium">הרגלים חוזרים בכל שבוע, בימים שלהם</span>
            </label>
          )}
        </div>

        {events.length === 0 ? (
          <p className="py-4 text-center text-muted">אין כאן כלום עם שעה. מוסיפים שעה למשימה, אימון, ארוחה, תזכורת או הרגל, והם יופיעו כאן.</p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((e) => {
              const header = range === 'week' && e.date !== lastDay ? e.date : null;
              lastDay = e.date;
              const color = KIND_COLORS[e.kind];
              return (
                <li key={e.uid}>
                  {header && <p className="mb-1 mt-3 text-sm font-bold text-muted first:mt-0">{formatLong(header)}</p>}
                  <label className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl bg-canvas px-3 py-2">
                    <input type="checkbox" className="h-5 w-5 shrink-0 accent-blue-600" checked={!skipped.has(e.uid)} onChange={() => toggle(e.uid)} />
                    <span className="w-12 shrink-0 text-sm font-bold tabular-nums" style={{ color }}>
                      {e.time}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {KIND_EMOJI[e.kind]} {e.title}
                      </span>
                      {e.repeat && (
                        <span className="text-xs text-muted">{e.repeat === 'daily' ? 'כל יום' : `כל שבוע: ${describeDays({ days: e.repeat })}`}</span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: color }}>
                      {KIND_LABEL[e.kind]}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {isStandaloneApp() && (
          <p className="text-center text-sm text-muted">בחלון שייפתח: "שמירה בקבצים". אחר כך פותחים את הקובץ ולוחצים "הוסף הכול".</p>
        )}
        <Button className="w-full" onClick={send} disabled={chosen.length === 0}>
          <CalendarPlus size={18} /> הוסף ליומן ({chosen.length})
        </Button>

      </div>
    </BottomSheet>
  );
}
