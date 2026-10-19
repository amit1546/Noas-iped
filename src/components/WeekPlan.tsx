import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRemindersBetween, useSettings, useTasksBetween, useWorkoutsBetween } from '../db/queries';
import { isWorkoutDone, type ISODate } from '../db/schema';
import { fromISO, rangeISO, shiftISO, todayISO, weekStartISO } from '../lib/dates';
import { KIND_COLORS } from '../lib/kinds';
import { isWorkDay } from '../lib/workdays';

type Kind = 'task' | 'workout' | 'reminder';
type Entry = { key: string; kind: Kind; title: string; time?: string; done: boolean };

const MAX_SHOWN = 4;

/**
 * The whole week (Sunday–Saturday) at a glance: what's planned on each day.
 * Tapping a day opens it in the day view.
 */
export function WeekPlan({ date, onChange, onOpenDay }: { date: ISODate; onChange: (d: ISODate) => void; onOpenDay: (d: ISODate) => void }) {
  const start = weekStartISO(date);
  const end = shiftISO(start, 6);
  const days = rangeISO(start, 7);
  const today = todayISO();
  const settings = useSettings();

  const tasks = useTasksBetween(start, end);
  const workouts = useWorkoutsBetween(start, end);
  const reminders = useRemindersBetween(start, end);

  const byDay = new Map<ISODate, Entry[]>(days.map((d) => [d, []]));
  for (const t of tasks) byDay.get(t.date)?.push({ key: `task-${t.id}`, kind: 'task', title: t.title, time: t.time, done: t.done });
  for (const w of workouts)
    byDay.get(w.date)?.push({ key: `workout-${w.id}`, kind: 'workout', title: w.title || 'אימון', time: w.time, done: isWorkoutDone(w) });
  for (const r of reminders) byDay.get(r.date)?.push({ key: `reminder-${r.id}`, kind: 'reminder', title: r.text, time: r.time, done: false });
  for (const list of byDay.values())
    list.sort((a, b) => Number(a.done) - Number(b.done) || (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));

  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const rangeLabel = sameMonth
    ? `${format(fromISO(start), 'd')}–${format(fromISO(end), 'd בMMMM', { locale: he })}`
    : `${format(fromISO(start), 'd בMMM', { locale: he })} – ${format(fromISO(end), 'd בMMM', { locale: he })}`;
  const isThisWeek = start === weekStartISO(today);
  const workouts7 = workouts.length;

  return (
    <div>
      <div className="card mb-5 flex items-center justify-between p-3">
        <button
          aria-label="שבוע קודם"
          onClick={() => onChange(shiftISO(date, -7))}
          className="grid h-14 w-14 place-items-center rounded-2xl bg-canvas text-ink hover:bg-line/60 active:scale-95"
        >
          <ChevronRight size={28} />
        </button>
        <div className="flex flex-1 flex-col items-center py-1">
          <span className="flex items-center gap-2 text-2xl font-extrabold leading-tight">
            {isThisWeek ? 'השבוע' : 'שבוע'}
          </span>
          <span className="mt-0.5 text-lg font-bold text-blue-600 dark:text-blue-400">{rangeLabel}</span>
          <span className="mt-1 text-sm text-muted">
            {workouts7 === 0 ? 'אין אימונים מתוכננים' : workouts7 === 1 ? 'אימון אחד השבוע' : `${workouts7} אימונים השבוע`}
          </span>
        </div>
        <button
          aria-label="שבוע הבא"
          onClick={() => onChange(shiftISO(date, 7))}
          className="grid h-14 w-14 place-items-center rounded-2xl bg-canvas text-ink hover:bg-line/60 active:scale-95"
        >
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {days.map((d) => {
          const list = byDay.get(d) ?? [];
          const shown = list.slice(0, MAX_SHOWN);
          const extra = list.length - shown.length;
          const isToday = d === today;
          const past = d < today;
          return (
            <button
              key={d}
              onClick={() => onOpenDay(d)}
              className={`card w-full p-4 text-start transition active:scale-[0.99] ${isToday ? 'ring-2 ring-blue-500' : ''} ${past ? 'opacity-70' : ''}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg font-extrabold">{format(fromISO(d), 'EEEE', { locale: he })}</span>
                <span className="text-sm font-semibold text-muted">{format(fromISO(d), 'd/M')}</span>
                {isToday && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">היום</span>}
                <span className="flex-1" />
                {isWorkDay(d, settings) && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-500/20 dark:text-slate-200">
                    עבודה
                  </span>
                )}
                <ChevronLeft size={18} className="text-muted" />
              </div>
              {list.length === 0 ? (
                <p className="text-sm text-muted">פנוי</p>
              ) : (
                <ul className="space-y-1">
                  {shown.map((e) => (
                    <li key={e.key} className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: KIND_COLORS[e.kind] }} />
                      {e.time && (
                        <span className="font-semibold tabular-nums" style={{ color: KIND_COLORS[e.kind] }}>
                          {e.time}
                        </span>
                      )}
                      <span className={`min-w-0 flex-1 truncate font-medium ${e.done ? 'text-muted line-through' : ''}`}>{e.title}</span>
                    </li>
                  ))}
                  {extra > 0 && <li className="text-xs font-semibold text-muted">ועוד {extra}…</li>}
                </ul>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted">
        {(
          [
            ['task', 'משימה'],
            ['workout', 'אימון'],
            ['reminder', 'תזכורת'],
          ] as const
        ).map(([k, label]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: KIND_COLORS[k] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
