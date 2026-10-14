import { Clock, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * A small "+ שעה" chip that turns into a time picker only when tapped,
 * so adding a time is clearly optional.
 */
export function OptionalTime({ value, onChange, label = 'שעה' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [open, setOpen] = useState(!!value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!value) setOpen(false);
  }, [value]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => ref.current?.focus(), 0);
        }}
        className="chip shrink-0 text-muted hover:text-ink"
        aria-label={`הוסף ${label}`}
      >
        <Clock size={15} /> + שעה
      </button>
    );
  }
  return (
    <span className="chip shrink-0 gap-1 border-blue-300 bg-blue-50 pe-1 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300">
      <Clock size={15} />
      <input
        ref={ref}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-[88px] bg-transparent font-semibold tabular-nums outline-none"
        aria-label={label}
      />
      <button
        type="button"
        aria-label="בלי שעה"
        onClick={() => {
          onChange('');
          setOpen(false);
        }}
        className="grid h-7 w-7 place-items-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20"
      >
        <X size={14} />
      </button>
    </span>
  );
}
