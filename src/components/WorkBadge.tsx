import { Briefcase } from 'lucide-react';
import { useSettings } from '../db/queries';
import type { ISODate } from '../db/schema';
import { isWorkDay } from '../lib/workdays';

/** "💼 יום עבודה" pill, shown only when the date is a work day. */
export function WorkBadge({ date, className = '' }: { date: ISODate; className?: string }) {
  const settings = useSettings();
  if (!isWorkDay(date, settings)) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-500/20 dark:text-slate-200 ${className}`}
    >
      <Briefcase size={13} /> יום עבודה
    </span>
  );
}
