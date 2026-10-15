import { Briefcase, Plus } from 'lucide-react';
import { setWorkDayOverride, useSettings } from '../db/queries';
import type { ISODate } from '../db/schema';
import { isWeeklyWorkDay, isWorkDay } from '../lib/workdays';

/**
 * "יום עבודה" pill. Read-only it shows only on work days; interactive it is a
 * one-tap toggle for marking (or un-marking) that exact date.
 */
export function WorkBadge({
  date,
  className = '',
  interactive = false,
}: {
  date: ISODate;
  className?: string;
  interactive?: boolean;
}) {
  const settings = useSettings();
  const work = isWorkDay(date, settings);

  if (!interactive) {
    if (!work) return null;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-500/20 dark:text-slate-200 ${className}`}
      >
        <Briefcase size={13} /> יום עבודה
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setWorkDayOverride(date, !work, isWeeklyWorkDay(date, settings))}
      aria-pressed={work}
      className={`relative inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition active:scale-95 ${
        work
          ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
          : 'border border-dashed border-line text-muted hover:text-ink'
      } ${className}`}
    >
      {work ? <Briefcase size={15} /> : <Plus size={15} />}
      {work ? 'יום עבודה' : 'סמן כיום עבודה'}
    </button>
  );
}
