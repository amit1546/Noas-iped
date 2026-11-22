import { Briefcase, Heart, Moon, Plus, Sun } from 'lucide-react';
import { markWorkDay, setNoaDay, setWorkShift, useSettings } from '../db/queries';
import type { ISODate, WorkShift } from '../db/schema';
import { isNoaDay, isWeeklyWorkDay, isWorkDay, shiftOf } from '../lib/workdays';

export const SHIFT_LABEL: Record<WorkShift, string> = { morning: 'בוקר', evening: 'ערב' };
export const ShiftIcon = ({ shift, size = 14 }: { shift: WorkShift; size?: number }) =>
  shift === 'morning' ? <Sun size={size} /> : <Moon size={size} />;

const BADGE = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold';

/**
 * What kind of day it is: a work day (with its shift) and/or a day at Noa's.
 * Read-only it shows only what applies; interactive it is a set of one-tap toggles for that exact date.
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
  const shift = shiftOf(date, settings);
  const noa = isNoaDay(date, settings);

  if (!interactive) {
    if (!work && !noa) return null;
    return (
      <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
        {work && (
          <span className={`${BADGE} bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200`}>
            <Briefcase size={13} /> יום עבודה
            {shift && (
              <>
                {' · '}
                <ShiftIcon shift={shift} size={13} /> {SHIFT_LABEL[shift]}
              </>
            )}
          </span>
        )}
        {noa && (
          <span className={`${BADGE} bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-200`}>
            <Heart size={13} /> אצל נועה
          </span>
        )}
      </span>
    );
  }

  const pill = (on: boolean, tone: string) =>
    `relative inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition active:scale-95 ${
      on ? tone : 'border border-dashed border-line text-muted hover:text-ink'
    }`;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => markWorkDay(date, !work, isWeeklyWorkDay(date, settings), shift)}
        aria-pressed={work}
        className={pill(work, 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900')}
      >
        {work ? <Briefcase size={15} /> : <Plus size={15} />}
        {work ? 'יום עבודה' : 'סמן כיום עבודה'}
      </button>
      {work &&
        (['morning', 'evening'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setWorkShift(date, shift === s ? undefined : s)}
            aria-pressed={shift === s}
            className={pill(shift === s, 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200')}
          >
            <ShiftIcon shift={s} size={15} /> {SHIFT_LABEL[s]}
          </button>
        ))}
      <button
        type="button"
        onClick={() => setNoaDay(date, !noa)}
        aria-pressed={noa}
        className={pill(noa, 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-200')}
      >
        <Heart size={15} /> אצל נועה
      </button>
    </div>
  );
}
