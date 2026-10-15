import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { fromISO, shiftISO, todayISO } from '../lib/dates';
import { WorkBadge } from './WorkBadge';
import type { ISODate } from '../db/schema';

export function DateNav({ date, onChange }: { date: ISODate; onChange: (d: ISODate) => void }) {
  const isToday = date === todayISO();
  return (
    <div className="card mb-5 flex items-center justify-between p-3">
      <button
        aria-label="יום קודם"
        onClick={() => onChange(shiftISO(date, -1))}
        className="grid h-14 w-14 place-items-center rounded-2xl bg-canvas text-ink hover:bg-line/60 active:scale-95"
      >
        <ChevronRight size={28} />
      </button>
      <label className="relative flex flex-1 cursor-pointer flex-col items-center py-1">
        <span className="flex items-center gap-2 text-3xl font-extrabold leading-tight">
          {format(fromISO(date), 'EEEE', { locale: he })}
          {isToday && <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-sm font-bold text-white">היום</span>}
        </span>
        <span className="mt-0.5 text-xl font-bold text-blue-600 dark:text-blue-400">
          {format(fromISO(date), 'd בMMMM yyyy', { locale: he })}
        </span>
        <WorkBadge date={date} className="mt-1.5" />
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="בחירת תאריך"
        />
      </label>
      <button
        aria-label="יום הבא"
        onClick={() => onChange(shiftISO(date, 1))}
        className="grid h-14 w-14 place-items-center rounded-2xl bg-canvas text-ink hover:bg-line/60 active:scale-95"
      >
        <ChevronLeft size={28} />
      </button>
    </div>
  );
}
