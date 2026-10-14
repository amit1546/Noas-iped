import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatLong, hebrewDate, shiftISO, todayISO } from '../lib/dates';
import type { ISODate } from '../db/schema';

export function DateNav({ date, onChange }: { date: ISODate; onChange: (d: ISODate) => void }) {
  const isToday = date === todayISO();
  return (
    <div className="card mb-5 flex items-center justify-between p-2">
      <button
        aria-label="יום קודם"
        onClick={() => onChange(shiftISO(date, -1))}
        className="grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-line/60 hover:text-ink"
      >
        <ChevronRight />
      </button>
      <label className="relative flex flex-1 cursor-pointer flex-col items-center">
        <span className="font-bold">{isToday ? 'היום' : formatLong(date)}</span>
        <span className="text-xs text-muted">
          {isToday ? formatLong(date) : hebrewDate(date)}
          {isToday && ` · ${hebrewDate(date)}`}
        </span>
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
        className="grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-line/60 hover:text-ink"
      >
        <ChevronLeft />
      </button>
    </div>
  );
}
